/**
 * Admin Documents Page
 *
 * Document management: list all 8 documents from config, show status badges,
 * upload/delete with confirmation dialogs and toast feedback.
 * File sizes in French format (1,2 Mo), large touch targets for elderly user.
 */

import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { DOCUMENTS } from '@/config/documents';
import { apiListDocuments, apiUploadDocument, apiDeleteDocument, DocumentFile } from '@/lib/admin-api';

type DocumentStatus = {
  key: string;
  label: string;
  available: boolean;
  size?: number;
  lastModified?: string;
};

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentStatus | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const loadDocuments = async () => {
    setIsLoading(true);
    const response = await apiListDocuments();
    setIsLoading(false);

    if (!response.ok) {
      toast({
        title: 'Erreur',
        description: response.error || 'Impossible de charger les documents',
        variant: 'destructive',
      });
      return;
    }

    // Map config documents to R2 files
    const r2Files = response.data || [];
    const statusList: DocumentStatus[] = Object.entries(DOCUMENTS).map(([key, doc]) => {
      // Extract filename from path (e.g., /documents/bulletin_adhesion_2026.pdf -> bulletin_adhesion_2026.pdf)
      const filename = doc.path.split('/').pop() || '';
      const r2Key = `documents/${filename}`;
      const r2File = r2Files.find((f: DocumentFile) => f.key === r2Key);

      return {
        key,
        label: doc.label,
        available: !!r2File,
        size: r2File?.size,
        lastModified: r2File?.lastModified,
      };
    });

    setDocuments(statusList);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (key: string, file: File) => {
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

    setUploadingKey(key);
    const response = await apiUploadDocument(file, key);
    setUploadingKey(null);

    if (response.ok) {
      toast({
        title: 'Succès',
        description: 'Document téléversé avec succès',
      });
      loadDocuments();
    } else {
      toast({
        title: 'Erreur',
        description: response.error || 'Échec du téléversement',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;

    const response = await apiDeleteDocument(selectedDoc.key);
    setDeleteDialogOpen(false);
    setSelectedDoc(null);

    if (response.ok) {
      toast({
        title: 'Succès',
        description: 'Document supprimé avec succès',
      });
      loadDocuments();
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
    return `${mb.toFixed(1).replace('.', ',')} Mo`;
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-serif-title font-bold text-primary mb-6">
          Gestion des documents
        </h1>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif-title font-bold text-primary mb-2">
          Gestion des documents
        </h1>
        <p className="text-lg text-muted-foreground">
          Téléversez et supprimez les documents PDF du site
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.key}>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Badge variant={doc.available ? 'default' : 'secondary'} className="text-sm">
                  {doc.available ? 'En ligne' : 'Non disponible'}
                </Badge>
              </div>
              <CardTitle className="text-xl font-serif-title">
                {doc.label}
              </CardTitle>
              {doc.available && doc.size && (
                <CardDescription className="text-sm">
                  {formatFileSize(doc.size)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Upload button */}
              <input
                type="file"
                accept=".pdf"
                ref={(el) => (fileInputRefs.current[doc.key] = el)}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUpload(doc.key, file);
                  }
                  // Reset input
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                className="w-full min-h-[44px]"
                disabled={uploadingKey === doc.key}
                onClick={() => fileInputRefs.current[doc.key]?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingKey === doc.key ? 'Téléversement...' : doc.available ? 'Remplacer' : 'Téléverser'}
              </Button>

              {/* Delete button (only if document exists) */}
              {doc.available && (
                <Button
                  variant="destructive"
                  className="w-full min-h-[44px]"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{selectedDoc?.label}</strong> ?
              Cette action est irréversible.
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
