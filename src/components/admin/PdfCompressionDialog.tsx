import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function PdfCompressionDialog({ open, onCancel, onConfirm }: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(value) => { if (!value) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Réduire le document ?</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Ce document est trop volumineux pour être envoyé. Le site va essayer de le réduire.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-[48px] text-lg">Annuler</AlertDialogCancel>
          <AlertDialogAction className="min-h-[48px] text-lg" onClick={onConfirm}>
            Réduire et envoyer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
