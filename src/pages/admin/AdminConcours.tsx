/**
 * Admin Concours Page
 *
 * Manage concours documents in 3 categories:
 * - Règlements (active competitions)
 * - Palmarès Poétique (poetry contest results)
 * - Palmarès Artistique (artistic contest results)
 *
 * Features: upload, reorder (up/down), delete, view.
 * Large touch targets for elderly user.
 */

import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, FileText, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { CONCOURS_CATEGORIES } from '@/config/concours';
import {
  apiListConcours,
  apiUploadConcours,
  apiDeleteConcours,
  apiReorderConcours,
  type ConcoursItem,
  type ConcoursCategory,
} from '@/lib/admin-api';

type CategoryData = {
  items: ConcoursItem[];
  isLoading: boolean;
  isUploading: boolean;
};

export default function AdminConcours() {
  const [categories, setCategories] = useState<Record<ConcoursCategory, CategoryData>>({
    'reglements': { items: [], isLoading: true, isUploading: false },
    'palmares-poetique': { items: [], isLoading: true, isUploading: false },
    'palmares-artistique': { items: [], isLoading: true, isUploading: false },
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ category: ConcoursCategory; item: ConcoursItem } | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const loadAllCategories = async () => {
    const response = await apiListConcours('all');

    if (!response.ok) {
      toast({
        title: 'Erreur',
        description: response.error || 'Impossible de charger les documents',
        variant: 'destructive',
      });
      return;
    }

    if (response.data && typeof response.data === 'object' && !('items' in response.data)) {
      // Response is Record<ConcoursCategory, ConcoursItem[]>
      const data = response.data as Record<ConcoursCategory, ConcoursItem[]>;
      setCategories({
        'reglements': { items: data.reglements || [], isLoading: false, isUploading: false },
        'palmares-poetique': { items: data['palmares-poetique'] || [], isLoading: false, isUploading: false },
        'palmares-artistique': { items: data['palmares-artistique'] || [], isLoading: false, isUploading: false },
      });
    }
  };

  useEffect(() => {
    loadAllCategories();
  }, []);

  const handleUpload = async (category: ConcoursCategory, file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        title: 'Erreur',
        description: 'Seuls les fichiers PDF sont acceptés',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'Le fichier ne doit pas dépasser 5 Mo',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate filename in this category
    const existingItems = categories[category].items;
    const duplicate = existingItems.find(
      item => item.originalFilename.toLowerCase() === file.name.toLowerCase()
    );

    if (duplicate) {
      toast({
        title: 'Fichier existant',
        description: `Un fichier nommé "${file.name}" existe déjà dans cette catégorie. Veuillez renommer le fichier ou supprimer l'ancien.`,
        variant: 'default',
      });
      return;
    }

    // Set uploading state
    setCategories((prev) => ({
      ...prev,
      [category]: { ...prev[category], isUploading: true },
    }));

    const response = await apiUploadConcours(file, category);

    // Clear uploading state
    setCategories((prev) => ({
      ...prev,
      [category]: { ...prev[category], isUploading: false },
    }));

    if (response.ok) {
      toast({
        title: 'Succès',
        description: 'Document téléversé avec succès',
      });
      loadAllCategories();
    } else {
      toast({
        title: 'Erreur',
        description: response.error || 'Échec du téléversement',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const { category, item } = selectedItem;
    const response = await apiDeleteConcours(category, item.r2Key);
    setDeleteDialogOpen(false);
    setSelectedItem(null);

    if (response.ok) {
      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès',
      });
      loadAllCategories();
    } else {
      toast({
        title: 'Erreur',
        description: response.error || 'Échec de la suppression',
        variant: 'destructive',
      });
    }
  };

  const handleReorder = async (category: ConcoursCategory, r2Key: string, direction: 'up' | 'down') => {
    const response = await apiReorderConcours(category, r2Key, direction);

    if (response.ok) {
      const items = response.data?.items;
      // Update local state immediately for better UX
      if (items) {
        setCategories((prev) => ({
          ...prev,
          [category]: { ...prev[category], items },
        }));
      }
    } else {
      toast({
        title: 'Erreur',
        description: response.error || 'Échec du réordonnancement',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1).replace('.', ',')} Mo`;
  };

  const renderCategoryTab = (category: ConcoursCategory) => {
    const categoryData = categories[category];
    const categoryConfig = CONCOURS_CATEGORIES[category];

    return (
      <TabsContent value={category} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif-title font-bold text-primary">
              {categoryConfig.label}
            </h2>
            <p className="text-muted-foreground">{categoryConfig.description}</p>
          </div>

          {/* Upload button */}
          <div>
            <input
              type="file"
              accept=".pdf"
              ref={(el) => (fileInputRefs.current[category] = el)}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUpload(category, file);
                }
                e.target.value = '';
              }}
            />
            <Button
              variant="default"
              className="min-h-[44px]"
              disabled={categoryData.isUploading}
              onClick={() => fileInputRefs.current[category]?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {categoryData.isUploading ? 'Téléversement...' : 'Téléverser PDF'}
            </Button>
          </div>
        </div>

        {categoryData.isLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : categoryData.items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucun document dans cette catégorie
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {categoryData.items.map((item, index) => (
              <Card key={item.r2Key}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-xl font-serif-title">
                        {item.title}
                      </CardTitle>
                    </div>
                    {/* Reorder buttons (icon-only, right side) */}
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={index === 0}
                        onClick={() => handleReorder(category, item.r2Key, 'up')}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={index === categoryData.items.length - 1}
                        onClick={() => handleReorder(category, item.r2Key, 'down')}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardDescription className="text-sm">
                      Taille : {formatFileSize(item.size)}
                    </CardDescription>
                    <CardDescription className="text-sm font-medium">
                      Fichier : {item.originalFilename}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {/* View button */}
                    <Button
                      variant="secondary"
                      className="min-h-[44px]"
                      onClick={() => window.open(`/api/media/${item.r2Key}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>

                    {/* Delete button */}
                    <Button
                      variant="destructive"
                      className="min-h-[44px]"
                      onClick={() => {
                        setSelectedItem({ category, item });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif-title font-bold text-primary mb-2">
          Gestion des concours
        </h1>
        <p className="text-lg text-muted-foreground">
          Organisez les règlements et palmarès des concours
        </p>
      </div>

      <Tabs defaultValue="reglements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reglements">Règlements</TabsTrigger>
          <TabsTrigger value="palmares-poetique">Palmarès Poétique</TabsTrigger>
          <TabsTrigger value="palmares-artistique">Palmarès Artistique</TabsTrigger>
        </TabsList>

        {renderCategoryTab('reglements')}
        {renderCategoryTab('palmares-poetique')}
        {renderCategoryTab('palmares-artistique')}
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{selectedItem?.item.title}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
