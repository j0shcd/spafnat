import { useCallback, useEffect, useState } from 'react';
import { Link, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  apiDeleteDelegation,
  apiListDelegations,
  apiSaveDelegation,
  type Delegation,
  type DelegationPayload,
  type Gender,
} from '@/lib/admin-api';

type DelegationForm = DelegationPayload & {
  draftKey?: string;
};

const inputClassName = 'min-h-[44px] text-base';
const selectClassName = 'flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const textareaClassName = 'min-h-[96px] text-base';

const createBlankDelegation = (): DelegationForm => ({
  draftKey: `draft-${Date.now()}`,
  region: '',
  delegate: '',
  gender: 'M',
  address: '',
  website: '',
});

function getFormKey(delegation: DelegationForm): string {
  return delegation.id || delegation.draftKey || delegation.region;
}

function normalizeWebsiteForCompare(website?: string): string {
  return website?.trim() || '';
}

function hasDelegationChanged(current: DelegationForm, saved?: Delegation): boolean {
  if (!saved) return false;

  return (
    current.region !== saved.region ||
    current.delegate !== saved.delegate ||
    current.gender !== saved.gender ||
    current.address !== saved.address ||
    normalizeWebsiteForCompare(current.website) !== normalizeWebsiteForCompare(saved.website)
  );
}

function hasNewDelegationContent(delegation: DelegationForm): boolean {
  return Boolean(
    delegation.region.trim() ||
    delegation.delegate.trim() ||
    delegation.address.trim() ||
    normalizeWebsiteForCompare(delegation.website)
  );
}

export default function AdminDelegations() {
  const [delegations, setDelegations] = useState<DelegationForm[]>([]);
  const [savedDelegations, setSavedDelegations] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDelegation, setNewDelegation] = useState<DelegationForm>(createBlankDelegation);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [expandedWebsiteFields, setExpandedWebsiteFields] = useState<Set<string>>(new Set());

  const setCanonicalDelegations = useCallback((items: Delegation[]) => {
    setDelegations(items);
    setSavedDelegations(items);
  }, []);

  const loadDelegations = useCallback(async () => {
    setIsLoading(true);
    const response = await apiListDelegations();
    setIsLoading(false);

    if (!response.ok) {
      toast({
        title: 'Erreur',
        description: response.error || 'Impossible de charger les délégations',
        variant: 'destructive',
      });
      return;
    }

    setCanonicalDelegations(response.data || []);
  }, [setCanonicalDelegations]);

  useEffect(() => {
    loadDelegations();
  }, [loadDelegations]);

  const updateDelegation = (key: string, updates: Partial<DelegationForm>) => {
    setDelegations((current) =>
      current.map((delegation) =>
        getFormKey(delegation) === key ? { ...delegation, ...updates } : delegation
      )
    );
  };

  const updateNewDelegation = (updates: Partial<DelegationForm>) => {
    setNewDelegation((current) => ({ ...current, ...updates }));
  };

  const openAddDialog = () => {
    const blankDelegation = createBlankDelegation();
    setNewDelegation(blankDelegation);
    setExpandedWebsiteFields((current) => {
      const next = new Set(current);
      next.delete(getFormKey(blankDelegation));
      return next;
    });
    setAddDialogOpen(true);
  };

  const showWebsiteField = (key: string) => {
    setExpandedWebsiteFields((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
  };

  const saveDelegation = async (delegation: DelegationForm) => {
    const key = getFormKey(delegation);
    setSavingKey(key);

    const payload: DelegationPayload = {
      ...(delegation.id ? { id: delegation.id } : {}),
      region: delegation.region,
      delegate: delegation.delegate,
      gender: delegation.gender,
      address: delegation.address,
      ...(delegation.website ? { website: delegation.website } : {}),
    };

    const response = await apiSaveDelegation(payload);
    setSavingKey(null);

    if (response.ok && response.data?.delegations) {
      setCanonicalDelegations(response.data.delegations);
      if (!delegation.id) {
        setAddDialogOpen(false);
        setNewDelegation(createBlankDelegation());
      }
      toast({
        title: 'Succès',
        description: 'Délégation enregistrée avec succès',
      });
    } else {
      toast({
        title: 'Erreur',
        description: response.details?.join(' ') || response.error || "Échec de l'enregistrement",
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedDelegation) return;

    const response = await apiDeleteDelegation(selectedDelegation.id);
    setDeleteDialogOpen(false);
    setSelectedDelegation(null);

    if (response.ok && response.data?.delegations) {
      setCanonicalDelegations(response.data.delegations);
      toast({
        title: 'Succès',
        description: 'Délégation supprimée avec succès',
      });
    } else {
      toast({
        title: 'Erreur',
        description: response.error || 'Échec de la suppression',
        variant: 'destructive',
      });
    }
  };

  const renderDelegationFields = (
    delegation: DelegationForm,
    keyPrefix: string,
    onUpdate: (updates: Partial<DelegationForm>) => void
  ) => {
    const websiteFieldVisible = Boolean(
      normalizeWebsiteForCompare(delegation.website) || expandedWebsiteFields.has(keyPrefix)
    );

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${keyPrefix}-region`} className="text-base">
              Région
            </Label>
            <Input
              id={`${keyPrefix}-region`}
              value={delegation.region}
              onChange={(event) => onUpdate({ region: event.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${keyPrefix}-delegate`} className="text-base">
              Nom du délégué
            </Label>
            <Input
              id={`${keyPrefix}-delegate`}
              value={delegation.delegate}
              onChange={(event) => onUpdate({ delegate: event.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${keyPrefix}-gender`} className="text-base">
              Titre
            </Label>
            <select
              id={`${keyPrefix}-gender`}
              value={delegation.gender}
              onChange={(event) => onUpdate({ gender: event.target.value as Gender })}
              className={selectClassName}
            >
              <option value="M">Délégué</option>
              <option value="F">Déléguée</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${keyPrefix}-address`} className="text-base">
            Adresse
          </Label>
          <Textarea
            id={`${keyPrefix}-address`}
            value={delegation.address}
            onChange={(event) => onUpdate({ address: event.target.value })}
            className={textareaClassName}
          />
        </div>

        {websiteFieldVisible ? (
          <div className="space-y-2">
            <Label htmlFor={`${keyPrefix}-website`} className="text-base">
              Site web
            </Label>
            <Input
              id={`${keyPrefix}-website`}
              value={delegation.website || ''}
              onChange={(event) => onUpdate({ website: event.target.value })}
              placeholder="exemple.fr"
              className={inputClassName}
            />
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-muted-foreground"
            onClick={() => showWebsiteField(keyPrefix)}
          >
            <Link className="h-4 w-4 mr-2" />
            Ajouter un site web
          </Button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-serif-title font-bold text-primary mb-6">
          Gestion des délégations
        </h1>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-serif-title font-bold text-primary mb-2">
            Gestion des délégations
          </h1>
          <p className="text-lg text-muted-foreground">
            Modifiez les délégués régionaux affichés sur le site
          </p>
        </div>
        <Button className="min-h-[44px] text-base" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une délégation
        </Button>
      </div>

      {delegations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune délégation enregistrée
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {delegations.map((delegation) => {
            const key = getFormKey(delegation);
            const savedDelegation = savedDelegations.find((item) => item.id === delegation.id);
            const isDirty = hasDelegationChanged(delegation, savedDelegation);

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-xl font-serif-title flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    {delegation.region}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {renderDelegationFields(delegation, key, (updates) => updateDelegation(key, updates))}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="min-h-[44px]"
                      disabled={!isDirty || savingKey === key}
                      onClick={() => saveDelegation(delegation)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {savingKey === key ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button
                      variant="destructive"
                      className="min-h-[44px]"
                      onClick={() => {
                        setSelectedDelegation(delegation as Delegation);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une délégation</DialogTitle>
            <DialogDescription>
              Remplissez les informations de la nouvelle délégation, puis cliquez sur Enregistrer.
            </DialogDescription>
          </DialogHeader>

          {renderDelegationFields(newDelegation, 'new-delegation', updateNewDelegation)}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={() => setAddDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="min-h-[44px]"
              disabled={!hasNewDelegationContent(newDelegation) || savingKey === getFormKey(newDelegation)}
              onClick={() => saveDelegation(newDelegation)}
            >
              <Save className="h-4 w-4 mr-2" />
              {savingKey === getFormKey(newDelegation) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la délégation
              {' '}<strong>{selectedDelegation?.region}</strong> ?
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
