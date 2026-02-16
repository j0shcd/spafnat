/**
 * Admin Photos Page
 *
 * Photo management: year selector, responsive grid, upload (multi-file with progress),
 * delete with confirmation dialog showing thumbnail preview.
 * Large touch targets for elderly user.
 */

import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { apiListPhotos, apiUploadPhoto, apiDeletePhoto, PhotoFile } from '@/lib/admin-api';

export default function AdminPhotos() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => (currentYear - i).toString());

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadPhotos = async (year: string) => {
    setIsLoading(true);
    const response = await apiListPhotos(year);
    setIsLoading(false);

    if (!response.ok) {
      toast({
        title: 'Erreur',
        description: response.error || 'Impossible de charger les photos',
        variant: 'destructive',
      });
      return;
    }

    setPhotos(response.data || []);
  };

  useEffect(() => {
    loadPhotos(selectedYear);
  }, [selectedYear]);

  const handleUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = fileArray.filter((f) => !validTypes.includes(f.type));

    if (invalidFiles.length > 0) {
      toast({
        title: 'Erreur',
        description: 'Seuls les fichiers JPEG, PNG et WebP sont acceptés',
        variant: 'destructive',
      });
      return;
    }

    const oversizedFiles = fileArray.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'Erreur',
        description: 'Chaque fichier ne doit pas dépasser 5 Mo',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      setUploadProgress(`Envoi de ${i + 1}/${fileArray.length} photos...`);
      const response = await apiUploadPhoto(fileArray[i], selectedYear);

      if (response.ok) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsUploading(false);
    setUploadProgress('');

    if (errorCount === 0) {
      toast({
        title: 'Succès',
        description: `${successCount} photo(s) téléversée(s) avec succès`,
      });
    } else {
      toast({
        title: 'Téléversement partiel',
        description: `${successCount} réussie(s), ${errorCount} échouée(s)`,
        variant: 'destructive',
      });
    }

    loadPhotos(selectedYear);
  };

  const handleDelete = async () => {
    if (!selectedPhoto) return;

    const response = await apiDeletePhoto(selectedPhoto.key);
    setDeleteDialogOpen(false);
    setSelectedPhoto(null);

    if (response.ok) {
      toast({
        title: 'Succès',
        description: 'Photo supprimée avec succès',
      });
      loadPhotos(selectedYear);
    } else {
      toast({
        title: 'Erreur',
        description: response.error || 'Échec de la suppression',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(0)} Ko`;
    }
    return `${mb.toFixed(1).replace('.', ',')} Mo`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif-title font-bold text-primary mb-2">
          Gestion des photos
        </h1>
        <p className="text-lg text-muted-foreground">
          Téléversez et supprimez les photos de congrès
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Année du congrès</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-48 h-12 text-lg">
              <SelectValue placeholder="Sélectionner l'année" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year} className="text-lg">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files);
              }
              // Reset input
              e.target.value = '';
            }}
          />
          <Button
            size="lg"
            className="min-h-[48px] text-lg"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-5 w-5 mr-2" />
            {isUploading ? uploadProgress : 'Téléverser des photos'}
          </Button>
        </div>
      </div>

      {/* Photos grid */}
      {isLoading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : photos.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">
            Aucune photo pour l'année {selectedYear}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.key} className="overflow-hidden group">
              <CardContent className="p-0 relative">
                <img
                  src={photo.url}
                  alt={photo.key}
                  loading="lazy"
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3">
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {photo.key.split('/').pop()}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {formatFileSize(photo.size)}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-4">
                  Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.
                </p>
                {selectedPhoto && (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={selectedPhoto.url}
                      alt="Aperçu"
                      className="max-w-xs rounded-md border"
                    />
                    <p className="text-sm text-muted-foreground">
                      {selectedPhoto.key.split('/').pop()}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
