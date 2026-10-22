/**
 * Admin Documents Page
 *
 * Document management: list all 8 documents from config, show status badges,
 * upload/delete with confirmation dialogs and toast feedback.
 * File sizes in French format (1,2 Mo), large touch targets for elderly user.
 */

import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, FileText, Eye } from 'lucide-react';
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
import { generateRevueCoverFromPdf } from '@/lib/revueCoverGenerator';
import { compressPdf, PDF_UPLOAD_LIMIT_BYTES } from '@/lib/pdf-compression';
import { PdfCompressionDialog } from '@/components/admin/PdfCompressionDialog';

type DocumentStatus = {
  key: string;
  label: string;
  available: boolean;
  filename: string; // e.g., bulletin_adhesion.pdf
  size?: number;
  lastModified?: string;
  originalFilename?: string;
};

const REVUE_DOCUMENT_KEY = 'extraitRevue';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentStatus | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{ key: string; filename: string; file: File } | null>(null);
  const compressionController = useRef<AbortController | null>(null);
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
        filename, // Store filename for upload/delete
        available: !!r2File,
        size: r2File?.size,
        lastModified: r2File?.lastModified,
        originalFilename: r2File?.originalFilename || undefined,
      };
    });

    setDocuments(statusList);
  };

  useEffect(() => {
    loadDocuments();
    return () => compressionController.current?.abort();
  }, []);

  const handleUpload = async (key: string, filename: string, file: File) => {
    if (compressionController.current || pendingUpload) return;
    if (!file.type.includes('pdf')) {
      toast({
        title: 'Erreur',
        description: 'Seuls les fichiers PDF sont acceptés',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > PDF_UPLOAD_LIMIT_BYTES) {
      setPendingUpload({ key, filename, file });
      return;
    }

    await uploadDocument(key, filename, file);
  };

  const uploadDocument = async (key: string, filename: string, file: File) => {
    const controller = new AbortController();
    compressionController.current = controller;
    setUploadingKey(key);

    try {
      const prepared = await compressPdf(file, controller.signal);
      let generatedCoverFile: File | undefined;
      if (key === REVUE_DOCUMENT_KEY) {
        try {
          generatedCoverFile = await generateRevueCoverFromPdf(prepared);
        } catch {
          toast({
            title: 'Aperçu non généré',
            description: "Le PDF sera téléversé, mais l'image de couverture n'a pas pu être créée automatiquement.",
          });
        }
      }

      if (controller.signal.aborted) return;
      const response = await apiUploadDocument(prepared, filename, {
        coverFile: generatedCoverFile,
      });
      if (response.ok) {
        toast({ title: 'Succès', description: 'Document téléversé avec succès' });
        void loadDocuments();
      } else {
        toast({ title: 'Erreur', description: response.error || 'Échec du téléversement', variant: 'destructive' });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Impossible de préparer le document', variant: 'destructive' });
      }
    } finally {
      compressionController.current = null;
      setUploadingKey(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;

    const response = await apiDeleteDocument(selectedDoc.filename);
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
              {doc.available && (
                <div className="space-y-1">
                  {doc.size && (
                    <CardDescription className="text-sm">
                      Taille : {formatFileSize(doc.size)}
                    </CardDescription>
                  )}
                  {doc.originalFilename && (
                    <CardDescription className="text-sm font-medium">
                      Fichier : {doc.originalFilename}
                    </CardDescription>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Upload button */}
              <input
                type="file"
                accept=".pdf"
                aria-label={`Document : ${doc.label}`}
                disabled={uploadingKey !== null || !!pendingUpload}
                ref={(el) => (fileInputRefs.current[doc.key] = el)}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUpload(doc.key, doc.filename, file);
                  }
                  // Reset input
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                className="w-full min-h-[44px]"
                disabled={uploadingKey !== null || !!pendingUpload}
                onClick={() => fileInputRefs.current[doc.key]?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingKey === doc.key ? 'Téléversement...' : doc.available ? 'Remplacer' : 'Téléverser'}
              </Button>

              {/* View and Delete buttons (only if document exists) */}
              {doc.available && (
                <>
                  <Button
                    variant="secondary"
                    className="w-full min-h-[44px]"
                    onClick={() => window.open(`/api/media/documents/${doc.filename}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
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
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <PdfCompressionDialog open={!!pendingUpload} onCancel={() => setPendingUpload(null)} onConfirm={() => {
        if (!pendingUpload) return;
        const { key, filename, file } = pendingUpload;
        setPendingUpload(null);
        void uploadDocument(key, filename, file);
      }} />

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
