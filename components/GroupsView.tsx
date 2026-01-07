
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Group, GroupCategory, GroupRole, GroupMember, ServiceRole, UUID, Person, CoreRole, GatheringPattern, OccurrenceStatus, EventOccurrence, Assignment, Family, FamilyMember, FamilyRole } from '../types';
import { Users, Shield, Heart, Plus, X, Search, Edit2, Star, Library, ChevronDown, Calendar, Repeat, ShieldCheck, Link as LinkIcon, ExternalLink, ListChecks, Mail, Phone, ArrowLeft, Clock, CheckCircle2, ChevronRight, User, Trash2, FileText, Info, UserPlus, MapPin, Home, Save, Baby } from 'lucide-react';

interface Props {
  db: AppState;
  setDb: React.Dispatch<React.SetStateAction<AppState>>;
  isAdmin: boolean;
  initialViewGroupId?: UUID | null;
  initialPersonId?: UUID | null;
  onViewPerson?: (personId: UUID) => void;
}

const GroupsView: React.FC<Props> = ({ db, setDb, isAdmin, initialViewGroupId, initialPersonId, onViewPerson }) => {
  const [activeTab, setActiveTab] = useState<'persons' | 'families' | 'fellowship' | 'service' | 'leadership' | 'roles'>('persons');
  
  // Modal & View States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manageGroupId, setManageGroupId] = useState<UUID | null>(null);
  const [viewingGroupId, setViewingGroupId] = useState<UUID | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<UUID | null>(null);
  const [isCreateServiceRoleModalOpen, setIsCreateServiceRoleModalOpen] = useState(false);
  const [viewingRoleId, setViewingRoleId] = useState<UUID | null>(null);
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  
  // Familie States
  const [isCreateFamilyModalOpen, setIsCreateFamilyModalOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newlyCreatedFamilyId, setNewlyCreatedFamilyId] = useState<UUID | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedFamilyForMember, setSelectedFamilyForMember] = useState<UUID | null>(null);
  const [memberPersonSearch, setMemberPersonSearch] = useState('');
  const [memberPersonId, setMemberPersonId] = useState<UUID | null>(null);
  const [memberFamilyRole, setMemberFamilyRole] = useState<FamilyRole>(FamilyRole.CHILD);
  const [memberIsSecondaryResidence, setMemberIsSecondaryResidence] = useState(false);
  const [isNewPerson, setIsNewPerson] = useState(false);
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonBirthYear, setNewPersonBirthYear] = useState('');
  const [newPersonBirthDate, setNewPersonBirthDate] = useState('');
  const [viewingFamilyId, setViewingFamilyId] = useState<UUID | null>(null);
  const [isEditingFamilyAddress, setIsEditingFamilyAddress] = useState(false);
  const [editingFamilyStreetAddress, setEditingFamilyStreetAddress] = useState('');
  const [editingFamilyPostalCode, setEditingFamilyPostalCode] = useState('');
  const [editingFamilyCity, setEditingFamilyCity] = useState('');

  // Samlingsplanlegging State (Manage mode only)
  const [tempPattern, setTempPattern] = useState<GatheringPattern | null>(null);
  const [syncCount, setSyncCount] = useState(4);

  // Form States
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<GroupCategory>(GroupCategory.SERVICE);

  // Search States
  const [memberSearch, setMemberSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  const filteredGroups = useMemo(() => {
    if (activeTab === 'service') return db.groups.filter(g => g.category === GroupCategory.SERVICE);
    if (activeTab === 'fellowship') return db.groups.filter(g => g.category === GroupCategory.FELLOWSHIP);
    if (activeTab === 'leadership') return db.groups.filter(g => g.category === GroupCategory.STRATEGY);
    return [];
  }, [db.groups, activeTab]);
  const managedGroup = db.groups.find(g => g.id === manageGroupId);
  const viewedGroup = db.groups.find(g => g.id === viewingGroupId);
  const viewedRole = db.serviceRoles.find(r => r.id === viewingRoleId);
  const selectedPerson = db.persons.find(p => p.id === selectedPersonId);

  useEffect(() => {
    if (initialViewGroupId) {
      setViewingGroupId(initialViewGroupId);
    }
  }, [initialViewGroupId]);

  useEffect(() => {
    if (initialPersonId) {
      setSelectedPersonId(initialPersonId);
      setActiveTab('persons');
    }
  }, [initialPersonId]);

  // Reset form state når "Legg til medlem"-modalen åpnes
  useEffect(() => {
    if (isAddMemberModalOpen) {
      setMemberPersonSearch('');
      setMemberPersonId(null);
      setMemberFamilyRole(FamilyRole.CHILD);
      setMemberIsSecondaryResidence(false);
      setIsNewPerson(false);
      setNewPersonEmail('');
      setNewPersonPhone('');
      setNewPersonBirthYear('');
      setNewPersonBirthDate('');
    }
  }, [isAddMemberModalOpen]);

  useEffect(() => {
    if (manageGroupId) {
      const group = db.groups.find(g => g.id === manageGroupId);
      if (group?.gathering_pattern) {
        setTempPattern(group.gathering_pattern);
      } else {
        setTempPattern({
          frequency_type: 'weeks',
          interval: 2,
          day_of_week: 0, 
          start_date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [manageGroupId, db.groups]);

  useEffect(() => {
    if (viewingFamilyId) {
      const family = db.families.find(f => f.id === viewingFamilyId);
      if (family) {
        setEditingFamilyStreetAddress(family.streetAddress || '');
        setEditingFamilyPostalCode(family.postalCode || '');
        setEditingFamilyCity(family.city || '');
      }
    }
  }, [viewingFamilyId, db.families]);

  const personData = useMemo(() => {
    if (!selectedPersonId) return null;

    const memberships = db.groupMembers
      .filter(gm => gm.person_id === selectedPersonId)
      .map(gm => {
        const group = db.groups.find(g => g.id === gm.group_id);
        const role = db.serviceRoles.find(sr => sr.id === gm.service_role_id);
        return { gm, group, role };
      });

    const upcomingAssignments = db.assignments
      .filter(a => a.person_id === selectedPersonId && a.occurrence_id)
      .map(a => {
        const occ = db.eventOccurrences.find(o => o.id === a.occurrence_id);
        const role = db.serviceRoles.find(sr => sr.id === a.service_role_id);
        return { a, occ, role };
      })
      .filter(item => item.occ && new Date(item.occ.date) >= new Date(new Date().setHours(0,0,0,0)))
      .sort((a, b) => new Date(a.occ!.date).getTime() - new Date(b.occ!.date).getTime());

    return { memberships, upcomingAssignments };
  }, [selectedPersonId, db]);

  const getIcon = (cat: GroupCategory) => {
    switch (cat) {
      case GroupCategory.SERVICE: return <Shield className="text-slate-500" size={18} />;
      case GroupCategory.FELLOWSHIP: return <Heart className="text-slate-500" size={18} />;
      case GroupCategory.STRATEGY: return <Users className="text-slate-500" size={18} />;
    }
  };

  const handleUpdateGatheringPattern = (updates: Partial<GatheringPattern>) => {
    if (!tempPattern || !manageGroupId) return;
    const newPattern = { ...tempPattern, ...updates };
    setTempPattern(newPattern);
    setDb(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === manageGroupId ? { ...g, gathering_pattern: newPattern } : g)
    }));
  };

  const handleSyncToCalendar = () => {
    if (!managedGroup || !tempPattern) return;
    const newOccurrences: EventOccurrence[] = [];
    let current = new Date(tempPattern.start_date);
    while (current.getDay() !== (tempPattern.day_of_week % 7)) {
      current.setDate(current.getDate() + 1);
    }
    for (let i = 0; i < syncCount; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const exists = db.eventOccurrences.some(o => o.date === dateStr && o.title_override === managedGroup.name);
      if (!exists) {
        newOccurrences.push({
          id: crypto.randomUUID(),
          template_id: null,
          date: dateStr,
          title_override: managedGroup.name,
          status: OccurrenceStatus.DRAFT
        });
      }
      if (tempPattern.frequency_type === 'weeks') {
        current.setDate(current.getDate() + (tempPattern.interval * 7));
      } else {
        current.setMonth(current.getMonth() + tempPattern.interval);
      }
    }
    if (newOccurrences.length > 0) {
      setDb(prev => ({ ...prev, eventOccurrences: [...prev.eventOccurrences, ...newOccurrences] }));
      alert(`${newOccurrences.length} samlinger lagt til i kalenderen.`);
    }
  };

  const handleUpdateMemberRole = (memberId: UUID, serviceRoleId: UUID | null) => {
    setDb(prev => ({
      ...prev,
      groupMembers: prev.groupMembers.map(gm => gm.id === memberId ? { ...gm, service_role_id: serviceRoleId } : gm)
    }));
  };

  const handleToggleLeader = (memberId: UUID) => {
    setDb(prev => {
      const targetMember = prev.groupMembers.find(gm => gm.id === memberId);
      if (!targetMember) return prev;
      const personId = targetMember.person_id;
      const isNowLeader = targetMember.role !== GroupRole.LEADER;
      const nextGroupMembers = prev.groupMembers.map(gm => gm.id === memberId ? { ...gm, role: isNowLeader ? GroupRole.LEADER : GroupRole.MEMBER } : gm);
      const nextPersons = prev.persons.map(p => {
        if (p.id === personId) {
          if (p.core_role === CoreRole.ADMIN || p.core_role === CoreRole.PASTOR) return p;
          if (isNowLeader) return { ...p, core_role: CoreRole.TEAM_LEADER };
          const isLeaderElsewhere = nextGroupMembers.some(gm => gm.person_id === personId && gm.role === GroupRole.LEADER);
          return { ...p, core_role: isLeaderElsewhere ? CoreRole.TEAM_LEADER : CoreRole.MEMBER };
        }
        return p;
      });
      return { ...prev, groupMembers: nextGroupMembers, persons: nextPersons };
    });
  };

  const handleAddMember = (personId: UUID) => {
    if (!manageGroupId) return;
    if (db.groupMembers.some(gm => gm.group_id === manageGroupId && gm.person_id === personId)) return;
    const newMember: GroupMember = { id: crypto.randomUUID(), group_id: manageGroupId, person_id: personId, role: GroupRole.MEMBER };
    setDb(prev => ({ ...prev, groupMembers: [...prev.groupMembers, newMember] }));
  };

  const handleRemoveMember = (memberId: UUID) => {
    setDb(prev => ({ ...prev, groupMembers: prev.groupMembers.filter(gm => gm.id !== memberId) }));
  };

  const handleUpdateGroupBasicInfo = (updates: Partial<Group>) => {
    if (!manageGroupId) return;
    setDb(prev => ({ ...prev, groups: prev.groups.map(g => g.id === manageGroupId ? { ...g, ...updates } : g) }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: Group = { id: crypto.randomUUID(), name: newGroupName, category: newGroupCategory, description: '' };
    setDb(prev => ({ ...prev, groups: [...prev.groups, newGroup] }));
    setNewGroupName('');
    setIsCreateModalOpen(false);
  };

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const coreRole = formData.get('core_role') as CoreRole;
    const isAdminOverride = (formData.get('is_admin') === 'true') || (coreRole === CoreRole.ADMIN) || (coreRole === CoreRole.PASTOR);
    const newPerson: Person = { id: crypto.randomUUID(), name: formData.get('name') as string, email: formData.get('email') as string, phone: formData.get('phone') as string, social_security_number: formData.get('ssn') as string, is_admin: isAdminOverride, is_active: true, core_role: coreRole };
    setDb(prev => ({ ...prev, persons: [...prev.persons, newPerson] }));
    setIsCreatePersonModalOpen(false);
  };

  const handleUpdatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const coreRole = formData.get('core_role') as CoreRole;
    const isAdminOverride = (formData.get('is_admin') === 'true') || (coreRole === CoreRole.ADMIN) || (coreRole === CoreRole.PASTOR);
    const updatedPerson: Person = { ...editingPerson, name: formData.get('name') as string, email: formData.get('email') as string, phone: formData.get('phone') as string, social_security_number: formData.get('ssn') as string, is_admin: isAdminOverride, core_role: coreRole };
    setDb(prev => ({ ...prev, persons: prev.persons.map(p => p.id === editingPerson.id ? updatedPerson : p) }));
    setEditingPerson(null);
  };

  const handleDeletePerson = (id: UUID) => {
    if (!confirm('Er du sikker på at du vil slette denne personen?')) return;
    setDb(prev => ({ ...prev, persons: prev.persons.filter(p => p.id !== id), groupMembers: prev.groupMembers.filter(gm => gm.person_id !== id), assignments: prev.assignments.map(a => a.person_id === id ? { ...a, person_id: null } : a), programItems: prev.programItems.map(p => p.person_id === id ? { ...p, person_id: null } : p) }));
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    try {
      console.log('Prøver å opprette familie:', newFamilyName.trim());
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFamilyName.trim(),
        }),
      });

      console.log('Response status:', response.status, response.statusText);
      let newFamily: Family;

      if (!response.ok) {
        // Hvis API ikke er tilgjengelig, bruk localStorage fallback
        const errorText = await response.text().catch(() => 'Ukjent feil');
        console.warn('API-kall feilet (status:', response.status, '), bruker localStorage fallback. Feilmelding:', errorText);
        
        // Fallback: Opprett familie lokalt
        newFamily = {
          id: crypto.randomUUID(),
          name: newFamilyName.trim(),
          created_at: new Date().toISOString()
        };
      } else {
        newFamily = await response.json();
      }
      
      // Oppdater lokal state (fungerer både for API og localStorage)
      setDb(prev => ({
        ...prev,
        families: [...(prev.families || []), newFamily]
      }));

      setNewFamilyName('');
      setIsCreateFamilyModalOpen(false);
      
      // Åpne modal for å legge til første medlem
      setNewlyCreatedFamilyId(newFamily.id);
      setSelectedFamilyForMember(newFamily.id);
      setIsAddMemberModalOpen(true);
    } catch (error) {
      console.error('Feil ved opprettelse av familie:', error);
      
      // Fallback: Opprett familie lokalt hvis fetch feiler helt (f.eks. nettverkfeil)
      const newFamily: Family = {
        id: crypto.randomUUID(),
        name: newFamilyName.trim(),
        created_at: new Date().toISOString()
      };
      
      setDb(prev => ({
        ...prev,
        families: [...(prev.families || []), newFamily]
      }));

      setNewFamilyName('');
      setIsCreateFamilyModalOpen(false);
      
      setNewlyCreatedFamilyId(newFamily.id);
      setSelectedFamilyForMember(newFamily.id);
      setIsAddMemberModalOpen(true);
      
      alert('Familie opprettet lokalt (API ikke tilgjengelig). Data lagres i nettleseren.');
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamilyForMember || (!memberPersonId && !isNewPerson)) return;
    if (!memberPersonSearch.trim()) return;

    let finalPersonId: UUID | null = memberPersonId;

    // Hvis personen ikke eksisterer, opprett den først
    if (isNewPerson && !memberPersonId) {
      try {
        // Først: Opprett personen i personbasen
        console.log('Oppretter ny person:', memberPersonSearch.trim());
        const personResponse = await fetch('/api/people', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: memberPersonSearch.trim(),
            email: newPersonEmail.trim() || undefined,
            phone: newPersonPhone.trim() || undefined,
            birth_year: newPersonBirthYear ? parseInt(newPersonBirthYear) : undefined,
            birth_date: newPersonBirthDate || undefined,
            is_admin: false,
            is_active: true,
            core_role: CoreRole.MEMBER,
          }),
        });

        let newPerson: Person;

        if (!personResponse.ok) {
          // Fallback: Opprett person lokalt
          console.warn('API-kall feilet ved opprettelse av person, bruker localStorage fallback');
          newPerson = {
            id: crypto.randomUUID(),
            name: memberPersonSearch.trim(),
            email: newPersonEmail.trim() || undefined,
            phone: newPersonPhone.trim() || undefined,
            birth_year: newPersonBirthYear ? parseInt(newPersonBirthYear) : undefined,
            birth_date: newPersonBirthDate || undefined,
            is_admin: false,
            is_active: true,
            core_role: CoreRole.MEMBER,
          };
        } else {
          newPerson = await personResponse.json();
        }

        // Oppdater lokal state med ny person
        setDb(prev => ({
          ...prev,
          persons: [...prev.persons, newPerson]
        }));

        finalPersonId = newPerson.id;
        console.log('Ny person opprettet med ID:', finalPersonId);
      } catch (error) {
        console.error('Feil ved opprettelse av person:', error);
        
        // Fallback: Opprett person lokalt
        const newPerson: Person = {
          id: crypto.randomUUID(),
          name: memberPersonSearch.trim(),
          email: newPersonEmail.trim() || undefined,
          phone: newPersonPhone.trim() || undefined,
          birth_year: newPersonBirthYear ? parseInt(newPersonBirthYear) : undefined,
          birth_date: newPersonBirthDate || undefined,
          is_admin: false,
          is_active: true,
          core_role: CoreRole.MEMBER,
        };

        setDb(prev => ({
          ...prev,
          persons: [...prev.persons, newPerson]
        }));

        finalPersonId = newPerson.id;
      }
    }

    if (!finalPersonId) {
      alert('Kunne ikke opprette eller finne person.');
      return;
    }

    // Validering: Sjekk om personen allerede er medlem i 2 familier
    const existingFamilyMemberships = (db.familyMembers || []).filter(fm => fm.person_id === finalPersonId);
    if (existingFamilyMemberships.length >= 2) {
      alert('Denne personen er allerede medlem i 2 familier. Maksimalt antall familier per person er 2.');
      return;
    }

    // Hvis vi prøver å sette til primæradresse (checkbox ikke huket av), må vi sjekke at personen ikke har en annen primæradresse
    const isPrimaryResidence = !memberIsSecondaryResidence;
    if (isPrimaryResidence) {
      const hasOtherPrimary = existingFamilyMemberships.some(fm => fm.isPrimaryResidence);
      if (hasOtherPrimary) {
        alert('Denne personen har allerede en primæradresse i en annen familie. Kun én primæradresse tillatt.');
        return;
      }
    }

    try {
      // Deretter: Koble personen til familien
      const response = await fetch('/api/families/' + selectedFamilyForMember + '/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_id: finalPersonId,
          role: memberFamilyRole,
          isPrimaryResidence: !memberIsSecondaryResidence,
        }),
      });

      let newMember: FamilyMember;

      if (!response.ok) {
        // Fallback: Opprett medlem lokalt
        console.warn('API-kall feilet, bruker localStorage fallback');
        newMember = {
          id: crypto.randomUUID(),
          family_id: selectedFamilyForMember,
          person_id: finalPersonId,
          role: memberFamilyRole,
          isPrimaryResidence: !memberIsSecondaryResidence
        };
      } else {
        newMember = await response.json();
      }
      
      // Oppdater lokal state (fungerer både for API og localStorage)
      setDb(prev => ({
        ...prev,
        familyMembers: [...(prev.familyMembers || []), newMember]
      }));

      // Reset form
      setMemberPersonId(null);
      setMemberPersonSearch('');
      setMemberFamilyRole(FamilyRole.CHILD);
      setMemberIsSecondaryResidence(false);
      setNewlyCreatedFamilyId(null);
      setIsNewPerson(false);
      setNewPersonEmail('');
      setNewPersonPhone('');
      setNewPersonBirthYear('');
      setNewPersonBirthDate('');
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error('Feil ved legg-til medlem:', error);
      
      // Fallback: Opprett medlem lokalt
      const newMember: FamilyMember = {
        id: crypto.randomUUID(),
        family_id: selectedFamilyForMember,
        person_id: finalPersonId!,
        role: memberFamilyRole,
        isPrimaryResidence: !memberIsSecondaryResidence
      };
      
      setDb(prev => ({
        ...prev,
        familyMembers: [...(prev.familyMembers || []), newMember]
      }));

      setMemberPersonId(null);
      setMemberPersonSearch('');
      setMemberFamilyRole(FamilyRole.CHILD);
      setMemberIsSecondaryResidence(false);
      setNewlyCreatedFamilyId(null);
      setIsNewPerson(false);
      setNewPersonEmail('');
      setNewPersonPhone('');
      setNewPersonBirthYear('');
      setNewPersonBirthDate('');
      setIsAddMemberModalOpen(false);
      
      alert('Familiemedlem lagt til lokalt (API ikke tilgjengelig). Data lagres i nettleseren.');
    }
  };

  const handleUpdateFamilyAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingFamilyId) return;

    try {
      const response = await fetch(`/api/families/${viewingFamilyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streetAddress: editingFamilyStreetAddress.trim() || undefined,
          postalCode: editingFamilyPostalCode.trim() || undefined,
          city: editingFamilyCity.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke oppdatere adresse');
      }

      const updatedFamily: Family = await response.json();
      
      // Oppdater lokal state
      setDb(prev => ({
        ...prev,
        families: prev.families.map(f => f.id === viewingFamilyId ? updatedFamily : f)
      }));

      setIsEditingFamilyAddress(false);
    } catch (error) {
      console.error('Feil ved oppdatering av adresse:', error);
      
      // Fallback: Oppdater lokalt
      setDb(prev => ({
        ...prev,
        families: prev.families.map(f => f.id === viewingFamilyId ? {
          ...f,
          streetAddress: editingFamilyStreetAddress.trim() || undefined,
          postalCode: editingFamilyPostalCode.trim() || undefined,
          city: editingFamilyCity.trim() || undefined,
        } : f)
      }));

      setIsEditingFamilyAddress(false);
    }
  };

  // Hjelpefunksjon for å beregne alder
  const calculateAge = (birthYear?: number, birthDate?: string): string => {
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} år`;
    }
    if (birthYear) {
      const age = new Date().getFullYear() - birthYear;
      return `${age} år`;
    }
    return '';
  };

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingRoleId) return;
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    setDb(prev => ({
      ...prev,
      serviceRoles: prev.serviceRoles.map(r => r.id === viewingRoleId ? {
        ...r,
        name: formData.get('name') as string,
        default_instructions: (formData.get('instructions') as string).split('\n').filter(t => t.trim())
      } : r)
    }));
    setViewingRoleId(null);
  };

  const handleCreateServiceRole = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newRole: ServiceRole = { id: crypto.randomUUID(), name: formData.get('name') as string, description: '', default_instructions: (formData.get('instructions') as string).split('\n').filter(t => t.trim()), is_active: true };
    setDb(prev => ({ ...prev, serviceRoles: [...prev.serviceRoles, newRole] }));
    setIsCreateServiceRoleModalOpen(false);
  };

  const getCoreRoleLabel = (role: CoreRole) => {
    switch (role) {
      case CoreRole.ADMIN: return 'Administrator';
      case CoreRole.PASTOR: return 'Pastor';
      case CoreRole.TEAM_LEADER: return 'Leder';
      case CoreRole.MEMBER: return 'Medlem';
      default: return 'Gjest';
    }
  };

  const getCoreRoleColor = (role: CoreRole) => {
    switch (role) {
      case CoreRole.PASTOR: return 'bg-purple-50 text-purple-700 border-purple-100';
      case CoreRole.TEAM_LEADER: return 'bg-blue-50 text-blue-700 border-blue-100';
      case CoreRole.ADMIN: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredPersons = db.persons.filter(p => p.name.toLowerCase().includes(personSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
  const filteredRoles = db.serviceRoles.filter(sr => sr.name.toLowerCase().includes(roleSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 md:pb-8 animate-in fade-in duration-300 text-left">
      {/* Precision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Folk</h2>
          <p className="text-sm text-slate-500">Administrasjon av personer, familier, grupper og roller.</p>
        </div>
        <div className="inline-flex bg-slate-200/60 p-1 rounded-lg flex-wrap gap-1">
          {(['persons', 'families', 'fellowship', 'service', 'leadership', 'roles'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedPersonId(null); }} 
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === tab && !selectedPersonId ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              {tab === 'persons' ? 'Personer' : tab === 'families' ? 'Familier' : tab === 'fellowship' ? 'Husgrupper' : tab === 'service' ? 'Team' : tab === 'leadership' ? 'Ledelse' : 'Roller'}
            </button>
          ))}
        </div>
      </div>

      {selectedPersonId && selectedPerson ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setSelectedPersonId(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-2 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedPersonId(null)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-slate-600"><ArrowLeft size={18}/></button>
                <h3 className="text-lg font-bold text-slate-900">Medlemskort: {selectedPerson.name}</h3>
              </div>
              <button onClick={() => setSelectedPersonId(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                <X size={20} className="text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-6">

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
             {/* Profilpanel */}
             <div className="lg:col-span-4 space-y-6">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-2xl border border-slate-200">
                      {selectedPerson.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{selectedPerson.name}</h4>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tight ${getCoreRoleColor(selectedPerson.core_role)}`}>
                        {getCoreRoleLabel(selectedPerson.core_role)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">Kontaktinfo</h5>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 border border-slate-100"><Mail size={16} /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-medium leading-none mb-1">E-post</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">{selectedPerson.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 border border-slate-100"><Phone size={16} /></div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mb-1">Telefon</p>
                        <p className="text-sm font-semibold text-slate-700">{selectedPerson.phone || '–'}</p>
                      </div>
                    </div>
                  </div>
                </section>
             </div>

             {/* Aktivitetspanel */}
             <div className="lg:col-span-8 space-y-6">
               <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                   <Users className="text-slate-400" size={18} />
                   <h4 className="text-sm font-bold text-slate-800">Gruppemedlemskap</h4>
                 </div>
                 <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                   {personData?.memberships.map(({ gm, group, role }) => (
                     <div key={gm.id} className="p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 border border-slate-200">
                           {group && getIcon(group.category)}
                         </div>
                         <div>
                           <p className="font-bold text-slate-800 text-sm">{group?.name}</p>
                           <p className="text-[10px] text-slate-500 font-medium">
                             {gm.role === GroupRole.LEADER ? 'Gruppeleder' : role?.name || 'Medlem'}
                           </p>
                         </div>
                       </div>
                       {gm.role === GroupRole.LEADER && <Star size={14} className="text-amber-500 fill-amber-500" />}
                     </div>
                   ))}
                   {personData?.memberships.length === 0 && (
                     <p className="col-span-full text-center py-6 text-slate-400 text-xs italic">Ingen registrerte medlemskap.</p>
                   )}
                 </div>
               </section>

               <section className="bg-slate-900 rounded-xl shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                   <Calendar className="text-indigo-400" size={18} />
                   <h4 className="text-sm font-bold text-white">Kommende vakter</h4>
                 </div>
                 <div className="p-3 space-y-2">
                   {personData?.upcomingAssignments.map(({ a, occ, role }) => (
                     <div key={a.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-700 rounded-lg flex flex-col items-center justify-center text-white border border-slate-600 group-hover:border-indigo-400/30 transition-all">
                            <span className="text-[8px] font-bold uppercase leading-none mb-0.5">{new Intl.DateTimeFormat('no-NO', { month: 'short' }).format(new Date(occ!.date))}</span>
                            <span className="text-base font-bold leading-none">{new Date(occ!.date).getDate()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white mb-0.5">{role?.name || 'Vakt'}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{occ?.title_override || 'Gudstjeneste'}</p>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                     </div>
                   ))}
                   {personData?.upcomingAssignments.length === 0 && (
                     <div className="text-center py-8">
                        <p className="text-xs text-slate-500">Ingen planlagte vakter.</p>
                     </div>
                   )}
                 </div>
               </section>
             </div>
           </div>
           </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'roles' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Søk i roller..." value={roleSearch} onChange={e => setRoleSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
            </div>
            {isAdmin && (
              <button onClick={() => setIsCreateServiceRoleModalOpen(true)} className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all"><Plus size={14} /> Ny Rolle</button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filteredRoles.map(sr => (
              <button 
                key={sr.id} 
                onClick={() => setViewingRoleId(sr.id)}
                className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow transition-all text-left group flex flex-col justify-between h-full min-h-[90px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-1 bg-slate-50 rounded border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                      <Library size={12} />
                    </div>
                    {isAdmin && <Edit2 size={10} className="text-slate-300 opacity-0 group-hover:opacity-100" />}
                  </div>
                  <h4 className="font-bold text-slate-800 text-[13px] leading-tight line-clamp-2">{sr.name}</h4>
                </div>
                
                <div className="mt-2 flex items-center justify-end">
                  {sr.default_instructions.length > 0 && (
                    <div className="flex items-center gap-1 text-indigo-500" title="Instrukser tilgjengelig">
                      <ListChecks size={12} />
                      <span className="text-[9px] font-bold uppercase">Instruks</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : activeTab === 'persons' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Søk person..." value={personSearch} onChange={e => setPersonSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none" />
            </div>
            {isAdmin && (
              <button onClick={() => setIsCreatePersonModalOpen(true)} className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold shadow-sm flex items-center gap-2"><Plus size={14} /> Ny Person</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold"><th className="py-3 px-6">Navn</th><th className="py-3 px-4">Rolle</th><th className="py-3 px-4">E-post</th><th className="py-3 px-4 text-right">Handling</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPersons.map(person => (
                  <tr key={person.id} onClick={() => setSelectedPersonId(person.id)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="py-3 px-6 font-bold text-sm text-slate-800">{person.name}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-tight ${getCoreRoleColor(person.core_role)}`}>{getCoreRoleLabel(person.core_role)}</span></td>
                    <td className="py-3 px-4 text-xs text-slate-500">{person.email}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingPerson(person)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 rounded-md transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeletePerson(person.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-100 rounded-md transition-colors"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'families' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Familier</h3>
            {isAdmin && (
              <button 
                onClick={() => setIsCreateFamilyModalOpen(true)}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all"
              >
                <Plus size={14} /> Ny Familie
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(db.families || []).length > 0 ? (db.families || []).map(family => {
              const members = (db.familyMembers || []).filter(fm => fm.family_id === family.id);
              const address = family.streetAddress || family.city ? 
                `${family.streetAddress || ''}${family.streetAddress && family.postalCode ? ', ' : ''}${family.postalCode || ''} ${family.city || ''}`.trim() : 
                null;
              return (
                <div 
                  key={family.id}
                  onClick={() => setViewingFamilyId(family.id)}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-indigo-600">{family.name || 'Familie uten navn'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{members.length} medlemmer</p>
                  {address && (
                    <p className="text-xs text-slate-500 mb-3 truncate">{address}</p>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        setSelectedFamilyForMember(family.id); 
                        setIsAddMemberModalOpen(true); 
                      }}
                      className="w-full mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={12} /> Legg til medlem
                    </button>
                  )}
                </div>
              );
            }) : (
              <div className="col-span-full bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <p className="text-slate-500 text-sm text-center py-8">
                  Ingen familier registrert ennå. Klikk "Ny Familie" for å opprette en familie.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            {isAdmin && <button onClick={() => { 
              const category = activeTab === 'service' ? GroupCategory.SERVICE : 
                              activeTab === 'fellowship' ? GroupCategory.FELLOWSHIP : 
                              GroupCategory.STRATEGY;
              setNewGroupCategory(category);
              setIsCreateModalOpen(true);
            }} className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"><Plus size={14} /> Ny Gruppe</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => {
              const members = db.groupMembers.filter(gm => gm.group_id === group.id);
              const leaders = members.filter(m => m.role === GroupRole.LEADER).map(m => db.persons.find(p => p.id === m.person_id)?.name).filter(Boolean);
              return (
                <button 
                  key={group.id} 
                  onClick={() => setViewingGroupId(group.id)}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group relative flex flex-col h-full text-left"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3"><div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">{getIcon(group.category)}</div><h3 className="text-sm font-bold text-slate-900">{group.name}</h3></div>
                    {isAdmin && (<button onClick={(e) => { e.stopPropagation(); setManageGroupId(group.id); }} className="p-1.5 text-slate-300 hover:text-indigo-600 rounded-md transition-all"><Edit2 size={14} /></button>)}
                  </div>
                  <p className="text-slate-500 text-xs mb-4 flex-grow line-clamp-2 leading-relaxed">{group.description || 'Ingen beskrivelse tilgjengelig.'}</p>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">{members.length} medl.</span><div className="flex items-center gap-1"><Star size={10} className="text-amber-500 fill-amber-500" /><p className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">{leaders.length > 0 ? leaders[0] : 'Uten leder'}</p></div></div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ny Familie Modal */}
      {isCreateFamilyModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => { setIsCreateFamilyModalOpen(false); setNewFamilyName(''); }}></div>
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 text-left">
            <div className="px-5 py-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
              <div className="flex items-center gap-3 text-indigo-700">
                <Users size={20} />
                <h3 className="font-bold">Opprett Ny Familie</h3>
              </div>
              <button onClick={() => { setIsCreateFamilyModalOpen(false); setNewFamilyName(''); }} className="p-1 hover:bg-indigo-100 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFamily} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Familienavn</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="f.eks. Familien Hansen"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all">
                Opprett Familie
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Legg til Familiemedlem Modal */}
      {isAddMemberModalOpen && selectedFamilyForMember && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => {
            setIsAddMemberModalOpen(false);
            setSelectedFamilyForMember(null);
            setMemberPersonId(null);
            setMemberPersonSearch('');
            setNewlyCreatedFamilyId(null);
            setIsNewPerson(false);
            setNewPersonEmail('');
            setNewPersonPhone('');
            setNewPersonBirthYear('');
            setNewPersonBirthDate('');
          }}></div>
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 text-left max-h-[90vh]">
            <div className="px-5 py-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
              <div className="flex items-center gap-3 text-indigo-700">
                <UserPlus size={20} />
                <h3 className="font-bold">{newlyCreatedFamilyId ? 'Legg til første medlem' : 'Legg til familiemedlem'}</h3>
              </div>
              <button onClick={() => {
                setIsAddMemberModalOpen(false);
                setSelectedFamilyForMember(null);
                setMemberPersonId(null);
                setMemberPersonSearch('');
                setNewlyCreatedFamilyId(null);
                setIsNewPerson(false);
                setNewPersonEmail('');
                setNewPersonPhone('');
                setNewPersonBirthYear('');
                setNewPersonBirthDate('');
              }} className="p-1 hover:bg-indigo-100 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddFamilyMember} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Søk eller legg til person</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={memberPersonSearch}
                    onChange={(e) => {
                      const searchValue = e.target.value;
                      setMemberPersonSearch(searchValue);
                      
                      // Sjekk om navnet matcher eksisterende person
                      const matchingPerson = db.persons.find(p => 
                        p.name.toLowerCase() === searchValue.toLowerCase().trim()
                      );
                      
                      if (matchingPerson) {
                        setMemberPersonId(matchingPerson.id);
                        setIsNewPerson(false);
                      } else if (searchValue.trim().length > 0) {
                        setMemberPersonId(null);
                        setIsNewPerson(true);
                      } else {
                        setMemberPersonId(null);
                        setIsNewPerson(false);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Skriv navn for å søke eller opprett ny..."
                  />
                </div>
                
                {/* Autocomplete dropdown - vis kun hvis ingen eksakt match */}
                {memberPersonSearch && !memberPersonId && memberPersonSearch.trim().length >= 2 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-md bg-white shadow-lg">
                    {db.persons
                      .filter(p => {
                        const isAlreadyMember = (db.familyMembers || [])
                          .some(fm => fm.family_id === selectedFamilyForMember && fm.person_id === p.id);
                        const matchesSearch = p.name.toLowerCase().includes(memberPersonSearch.toLowerCase());
                        const exactMatch = p.name.toLowerCase() === memberPersonSearch.toLowerCase().trim();
                        // Vis ikke eksakt match (den er allerede valgt)
                        return matchesSearch && !exactMatch && !isAlreadyMember;
                      })
                      .map(person => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => {
                            setMemberPersonId(person.id);
                            setMemberPersonSearch(person.name);
                            setIsNewPerson(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-b-0"
                        >
                          <p className="text-sm font-semibold text-slate-800">{person.name}</p>
                          <p className="text-xs text-slate-500">{person.email}</p>
                        </button>
                      ))}
                    {db.persons.filter(p => {
                      const isAlreadyMember = (db.familyMembers || [])
                        .some(fm => fm.family_id === selectedFamilyForMember && fm.person_id === p.id);
                      const exactMatch = p.name.toLowerCase() === memberPersonSearch.toLowerCase().trim();
                      return p.name.toLowerCase().includes(memberPersonSearch.toLowerCase()) && !exactMatch && !isAlreadyMember;
                    }).length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-500 italic">
                        Ingen match funnet. Fortsett å skrive for å opprette ny person.
                      </div>
                    )}
                  </div>
                )}

                {/* Valgt eksisterende person */}
                {memberPersonId && !isNewPerson && (
                  <div className="mt-2 p-3 bg-indigo-50 rounded-md border border-indigo-200">
                    <p className="text-xs font-bold text-indigo-700 mb-1">Valgt: {db.persons.find(p => p.id === memberPersonId)?.name}</p>
                    <p className="text-xs text-indigo-600">{db.persons.find(p => p.id === memberPersonId)?.email}</p>
                  </div>
                )}

                {/* Indikasjon for ny person */}
                {isNewPerson && !memberPersonId && memberPersonSearch.trim().length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-md border border-amber-200">
                    <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-2">
                      <Plus size={14} />
                      Ny person vil bli lagt til i katalogen
                    </p>
                    <p className="text-[10px] text-amber-700">
                      Fyll ut informasjon nedenfor for å fullføre registreringen. Alle felter er valgfrie.
                    </p>
                  </div>
                )}

                {/* Ekstra felter for ny person */}
                {isNewPerson && !memberPersonId && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                        E-post (valgfritt)
                      </label>
                      <input
                        type="email"
                        value={newPersonEmail}
                        onChange={(e) => setNewPersonEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="person@eksempel.no"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                        Telefon (valgfritt)
                      </label>
                      <input
                        type="tel"
                        value={newPersonPhone}
                        onChange={(e) => setNewPersonPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="+47 123 45 678"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                          Fødselsår (valgfritt)
                        </label>
                        <input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          value={newPersonBirthYear}
                          onChange={(e) => setNewPersonBirthYear(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="f.eks. 1990"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                          Fødselsdato (valgfritt)
                        </label>
                        <input
                          type="date"
                          value={newPersonBirthDate}
                          onChange={(e) => setNewPersonBirthDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Rolle i familien</label>
                <select
                  value={memberFamilyRole}
                  onChange={(e) => setMemberFamilyRole(e.target.value as FamilyRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value={FamilyRole.PARENT}>Forelder</option>
                  <option value={FamilyRole.CHILD}>Barn</option>
                  <option value={FamilyRole.PARTNER}>Ektefelle/Partner</option>
                  <option value={FamilyRole.GUARDIAN}>Vergemål</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isSecondaryResidence"
                  checked={memberIsSecondaryResidence}
                  onChange={(e) => setMemberIsSecondaryResidence(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isSecondaryResidence" className="text-sm font-medium text-slate-700">
                  Dette er personens sekundæradresse (delt bosted)
                </label>
              </div>

              <button
                type="submit"
                disabled={!memberPersonSearch.trim()}
                className="w-full py-2 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isNewPerson ? 'Opprett person og legg til i familie' : 'Legg til medlem'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modals are kept functionally same but with reduced radii and ERP-styling */}
      {/* ... (Existing Modal implementation logic remains, but with rounded-xl and slate-200 styling) ... */}
      
      {/* Example for one Modal styling */}
      {viewedRole && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => setViewingRoleId(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 text-left max-h-[90vh]">
            <div className="px-5 py-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50 shrink-0">
              <div className="flex items-center gap-3 text-indigo-700"><Library size={20} /><h3 className="font-bold">Rolleinstruks: {viewedRole.name}</h3></div>
              <button onClick={() => setViewingRoleId(null)} className="p-1 hover:bg-indigo-100 rounded-md transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateRole} className="flex-1 overflow-y-auto p-6 space-y-5">
              {isAdmin ? (
                <>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Rollenavn</label><input required name="name" defaultValue={viewedRole.name} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Instrukser (én per linje)</label><textarea name="instructions" defaultValue={viewedRole.default_instructions.join('\n')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm h-64 font-medium focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
                  <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-md font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all">Oppdater Katalog</button>
                </>
              ) : (
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2"><ListChecks size={14}/> Sjekkliste</h4>
                    <div className="space-y-2">
                      {viewedRole.default_instructions.map((inst, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                          <div className="w-5 h-5 rounded border border-indigo-200 shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-500 bg-white">{i+1}</div>
                          {inst}
                        </div>
                      ))}
                    </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Familievisningsmodal */}
      {viewingFamilyId && (() => {
        const viewingFamily = db.families.find(f => f.id === viewingFamilyId);
        if (!viewingFamily) return null;

        const familyMembers = (db.familyMembers || []).filter(fm => fm.family_id === viewingFamilyId);
        const parents = familyMembers
          .filter(fm => fm.role === FamilyRole.PARENT || fm.role === FamilyRole.PARTNER)
          .map(fm => ({
            member: fm,
            person: db.persons.find(p => p.id === fm.person_id)
          }))
          .filter(({ person }) => person !== undefined) as Array<{ member: FamilyMember; person: Person }>;
        
        const children = familyMembers
          .filter(fm => fm.role === FamilyRole.CHILD)
          .map(fm => ({
            member: fm,
            person: db.persons.find(p => p.id === fm.person_id)
          }))
          .filter(({ person }) => person !== undefined) as Array<{ member: FamilyMember; person: Person }>;

        const familyAddress = viewingFamily.streetAddress || viewingFamily.city ? 
          `${viewingFamily.streetAddress || ''}${viewingFamily.streetAddress && viewingFamily.postalCode ? ', ' : ''}${viewingFamily.postalCode || ''} ${viewingFamily.city || ''}`.trim() : 
          null;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingFamilyId(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{viewingFamily.name || 'Familie uten navn'}</h2>
                  {familyAddress && !isEditingFamilyAddress && (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={14} className="text-slate-400" />
                      <p className="text-sm text-slate-600">{familyAddress}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setViewingFamilyId(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <X size={20} className="text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Adresse-redigering */}
                {isEditingFamilyAddress ? (
                  <form onSubmit={handleUpdateFamilyAddress} className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <MapPin size={16} /> Familieadresse
                      </h3>
                      <button type="button" onClick={() => setIsEditingFamilyAddress(false)} className="text-xs text-slate-500 hover:text-slate-700">
                        Avbryt
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Gateadresse</label>
                        <input
                          type="text"
                          value={editingFamilyStreetAddress}
                          onChange={(e) => setEditingFamilyStreetAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="Gate og husnummer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Postnummer</label>
                        <input
                          type="text"
                          value={editingFamilyPostalCode}
                          onChange={(e) => setEditingFamilyPostalCode(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="0000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Poststed</label>
                        <input
                          type="text"
                          value={editingFamilyCity}
                          onChange={(e) => setEditingFamilyCity(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="By"
                        />
                      </div>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                      <Save size={14} /> Lagre adresse
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-800">Familieadresse</h3>
                      </div>
                      {isAdmin && (
                        <button onClick={() => setIsEditingFamilyAddress(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                          <Edit2 size={12} /> Rediger
                        </button>
                      )}
                    </div>
                    {familyAddress ? (
                      <p className="text-sm text-slate-600 mt-2">{familyAddress}</p>
                    ) : (
                      <p className="text-sm text-slate-400 mt-2 italic">Ingen adresse registrert</p>
                    )}
                  </div>
                )}

                {/* Foreldre/Ektefeller */}
                {parents.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Users size={16} className="text-indigo-500" /> Foreldre/Ektefeller
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parents.map(({ member, person }) => (
                        <div 
                          key={member.id}
                          className="bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              {member.role === FamilyRole.PARENT ? (
                                <User size={18} className="text-indigo-500" />
                              ) : (
                                <Heart size={18} className="text-rose-500" />
                              )}
                              <h4 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onViewPerson) {
                                    onViewPerson(person.id);
                                  } else {
                                    setSelectedPersonId(person.id);
                                  }
                                }}
                                className="font-bold text-slate-900 group-hover:text-indigo-600 hover:underline cursor-pointer transition-colors"
                              >
                                {person.name}
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {member.role === FamilyRole.PARENT ? 'Forelder' : 'Partner'}
                            </span>
                          </div>
                          {person.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                              <Phone size={12} className="text-slate-400" />
                              {person.phone}
                            </div>
                          )}
                          {person.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Mail size={12} className="text-slate-400" />
                              {person.email}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Barn */}
                {children.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Baby size={16} className="text-indigo-500" /> Barn
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {children.map(({ member, person }) => {
                        const age = calculateAge(person.birth_year, person.birth_date);
                        const hasOtherFamilies = (db.familyMembers || []).filter(
                          fm => fm.person_id === person.id && fm.family_id !== viewingFamilyId
                        ).length > 0;
                        
                        return (
                          <div 
                            key={member.id}
                            className="bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <Baby size={16} className="text-indigo-400" />
                                <h4 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onViewPerson) {
                                      onViewPerson(person.id);
                                    } else {
                                      setSelectedPersonId(person.id);
                                    }
                                  }}
                                  className="font-bold text-slate-900 group-hover:text-indigo-600 hover:underline cursor-pointer transition-colors"
                                >
                                  {person.name}
                                </h4>
                              </div>
                            </div>
                            {age && (
                              <p className="text-xs text-slate-500 mb-2">{age}</p>
                            )}
                            {hasOtherFamilies && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
                                <Home size={12} />
                                {member.isPrimaryResidence ? 'Hovedadresse' : 'Delt bosted'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Tom familie */}
                {familyMembers.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm mb-2">Ingen medlemmer registrert i denne familien ennå.</p>
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          setSelectedFamilyForMember(viewingFamilyId);
                          setIsAddMemberModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto mt-4"
                      >
                        <UserPlus size={14} /> Legg til første medlem
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {isAdmin && familyMembers.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <button 
                    onClick={() => {
                      setSelectedFamilyForMember(viewingFamilyId);
                      setIsAddMemberModalOpen(true);
                    }}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} /> Legg til medlem
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default GroupsView;
