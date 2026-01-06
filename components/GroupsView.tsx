
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Group, GroupCategory, GroupRole, GroupMember, ServiceRole, UUID, Person, CoreRole, GatheringPattern, OccurrenceStatus, EventOccurrence, Assignment } from '../types';
// Added Trash2 to imports from lucide-react to fix missing dependency
import { Users, Shield, Heart, Plus, X, Search, Edit2, Star, Library, ChevronDown, Calendar, Repeat, ShieldCheck, Link as LinkIcon, ExternalLink, ListChecks, Mail, Phone, ArrowLeft, Clock, CheckCircle2, ChevronRight, User, Trash2 } from 'lucide-react';

interface Props {
  db: AppState;
  setDb: React.Dispatch<React.SetStateAction<AppState>>;
  isAdmin: boolean;
  initialViewGroupId?: UUID | null;
}

const GroupsView: React.FC<Props> = ({ db, setDb, isAdmin, initialViewGroupId }) => {
  const [activeTab, setActiveTab] = useState<GroupCategory | 'persons' | 'roles'>(GroupCategory.SERVICE);
  
  // Modal & View States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manageGroupId, setManageGroupId] = useState<UUID | null>(null);
  const [viewingGroupId, setViewingGroupId] = useState<UUID | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<UUID | null>(null);
  const [isCreateServiceRoleModalOpen, setIsCreateServiceRoleModalOpen] = useState(false);
  const [viewingRoleId, setViewingRoleId] = useState<UUID | null>(null);
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

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

  const filteredGroups = db.groups.filter(g => g.category === activeTab);
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

  // Data for valgt person (Medlemskort)
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
      case GroupCategory.SERVICE: return <Shield className="text-indigo-500" size={20} />;
      case GroupCategory.FELLOWSHIP: return <Heart className="text-rose-500" size={20} />;
      case GroupCategory.STRATEGY: return <Users className="text-amber-500" size={20} />;
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

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingRoleId) return;
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    setDb(prev => ({
      ...prev,
      serviceRoles: prev.serviceRoles.map(r => r.id === viewingRoleId ? {
        ...r,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        default_instructions: (formData.get('instructions') as string).split('\n').filter(t => t.trim())
      } : r)
    }));
    setViewingRoleId(null);
  };

  const handleCreateServiceRole = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newRole: ServiceRole = { id: crypto.randomUUID(), name: formData.get('name') as string, description: formData.get('description') as string, default_instructions: (formData.get('instructions') as string).split('\n').filter(t => t.trim()), is_active: true };
    setDb(prev => ({ ...prev, serviceRoles: [...prev.serviceRoles, newRole] }));
    setIsCreateServiceRoleModalOpen(false);
  };

  const getCoreRoleLabel = (role: CoreRole) => {
    switch (role) {
      case CoreRole.ADMIN: return 'Administrator';
      case CoreRole.PASTOR: return 'Pastor';
      case CoreRole.TEAM_LEADER: return 'Gruppeleder';
      case CoreRole.MEMBER: return 'Medlem';
      default: return 'Gjest';
    }
  };

  const getCoreRoleColor = (role: CoreRole) => {
    switch (role) {
      case CoreRole.PASTOR: return 'bg-purple-100 text-purple-700';
      case CoreRole.TEAM_LEADER: return 'bg-blue-100 text-blue-700';
      case CoreRole.ADMIN: return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredPersons = db.persons.filter(p => p.name.toLowerCase().includes(personSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
  const filteredRoles = db.serviceRoles.filter(sr => sr.name.toLowerCase().includes(roleSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
  const memberSearchResults = db.persons.filter(p => p.name.toLowerCase().includes(memberSearch.toLowerCase()) && !db.groupMembers.some(gm => gm.group_id === manageGroupId && gm.person_id === p.id)).slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-0 animate-in fade-in duration-500 text-left">
      {/* Header og Navigasjon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Menighetens Oversikt</h2>
          <p className="text-xs text-slate-500">Administrer fellesskap, teams og medlemmer.</p>
        </div>
        <div className="inline-flex bg-slate-200 p-1 rounded-xl">
          <button onClick={() => { setActiveTab(GroupCategory.SERVICE); setSelectedPersonId(null); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === GroupCategory.SERVICE && !selectedPersonId ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Teams</button>
          <button onClick={() => { setActiveTab(GroupCategory.FELLOWSHIP); setSelectedPersonId(null); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === GroupCategory.FELLOWSHIP && !selectedPersonId ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Husgrupper</button>
          <button onClick={() => { setActiveTab(GroupCategory.STRATEGY); setSelectedPersonId(null); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === GroupCategory.STRATEGY && !selectedPersonId ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Styre</button>
          <button onClick={() => { setActiveTab('roles'); setSelectedPersonId(null); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'roles' && !selectedPersonId ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Roller</button>
          <button onClick={() => setActiveTab('persons')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'persons' || selectedPersonId ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Personer {selectedPersonId && <span className="ml-1 text-[10px] text-indigo-400 font-normal">/ Kort</span>}</button>
        </div>
      </div>

      {selectedPersonId && selectedPerson ? (
        <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
           <div className="flex items-center gap-4 mb-2">
             <button onClick={() => setSelectedPersonId(null)} className="p-2 bg-white rounded-xl shadow-sm border hover:bg-slate-50 transition-all text-slate-500"><ArrowLeft size={20}/></button>
             <h3 className="text-2xl font-bold text-slate-800">Medlemskort: {selectedPerson.name}</h3>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Venstre Kolonne: Kontaktinfo */}
             <div className="lg:col-span-1 space-y-6">
                <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-3xl mb-4 border-2 border-indigo-100">
                    {selectedPerson.name.charAt(0)}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedPerson.name}</h4>
                  <span className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getCoreRoleColor(selectedPerson.core_role)}`}>
                    {getCoreRoleLabel(selectedPerson.core_role)}
                  </span>

                  <div className="w-full mt-8 space-y-4 text-left">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Kontaktinformasjon</h5>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Mail className="text-indigo-400" size={18} />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">E-post</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">{selectedPerson.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Phone className="text-indigo-400" size={18} />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Telefon</p>
                        <p className="text-sm font-semibold text-slate-700">{selectedPerson.phone || 'Ikke oppgitt'}</p>
                      </div>
                    </div>
                  </div>
                </section>
             </div>

             {/* Høyre Kolonne: Grupper og Roller */}
             <div className="lg:col-span-2 space-y-8">
               <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h4 className="text-lg font-bold text-slate-800 flex items-center gap-3 mb-6">
                   <Users className="text-teal-500" size={22} /> Mine Grupper
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {personData?.memberships.map(({ gm, group, role }) => (
                     <div key={gm.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                       <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm`}>
                           {group && getIcon(group.category)}
                         </div>
                         <div>
                           <p className="font-bold text-slate-800 text-sm">{group?.name}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                             {gm.role === GroupRole.LEADER ? 'Gruppeleder' : role?.name || 'Medlem'}
                           </p>
                         </div>
                       </div>
                       {gm.role === GroupRole.LEADER && <Star size={16} className="text-amber-500 fill-amber-500" />}
                     </div>
                   ))}
                   {personData?.memberships.length === 0 && (
                     <p className="col-span-full text-center py-8 text-slate-400 text-xs italic">Ingen aktive gruppemedlemskap registrert.</p>
                   )}
                 </div>
               </section>

               <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                 <div className="absolute -top-4 -right-4 p-8 opacity-5 scale-150 rotate-12"><Calendar size={80} /></div>
                 <h4 className="text-xl font-bold flex items-center gap-3 mb-6 text-indigo-300 relative">
                   <Calendar className="text-indigo-300" size={24} /> Kommende Roller
                 </h4>
                 <div className="space-y-4 relative">
                   {personData?.upcomingAssignments.map(({ a, occ, role }) => (
                     <div key={a.id} className="bg-slate-800/40 p-5 rounded-2xl border-l-4 border-indigo-500 hover:bg-slate-800 transition-all shadow-lg flex items-center justify-between group">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex flex-col items-center justify-center text-white border border-slate-600 group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
                            <span className="text-[8px] font-bold uppercase leading-none mb-1">{new Intl.DateTimeFormat('no-NO', { month: 'short' }).format(new Date(occ!.date))}</span>
                            <span className="text-lg font-bold leading-none">{new Date(occ!.date).getDate()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                              {role?.name || 'Vakt'}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                                {occ?.title_override || 'Gudstjeneste'}
                              </p>
                            </div>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
                     </div>
                   ))}
                   {personData?.upcomingAssignments.length === 0 && (
                     <div className="text-center py-10 opacity-50">
                        <p className="text-xs text-indigo-400 font-bold">Ingen kommende vakter registrert.</p>
                     </div>
                   )}
                 </div>
               </section>
             </div>
           </div>
        </div>
      ) : activeTab === 'roles' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Søk i rollekatalog..." value={roleSearch} onChange={e => setRoleSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            {isAdmin && (
              <button onClick={() => setIsCreateServiceRoleModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow flex items-center gap-2 transition-all"><Plus size={16} /> Ny Katalogrolle</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map(sr => (
              <button 
                key={sr.id} 
                onClick={() => setViewingRoleId(sr.id)}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Library size={18} /></div>
                  {isAdmin && <div className="p-1.5 text-slate-400 group-hover:text-indigo-600 transition-colors"><Edit2 size={14} /></div>}
                </div>
                <h4 className="font-bold text-slate-800 mb-1">{sr.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{sr.description || 'Ingen beskrivelse.'}</p>
              </button>
            ))}
          </div>
        </div>
      ) : activeTab === 'persons' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Søk på navn..." value={personSearch} onChange={e => setPersonSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
            </div>
            {isAdmin && (
              <button onClick={() => setIsCreatePersonModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all"><Plus size={16} /> Ny Person</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b text-[10px] text-slate-400 uppercase tracking-widest font-bold"><th className="pb-3 px-4">Navn</th><th className="pb-3 px-4">Rolle</th><th className="pb-3 px-4">E-post</th><th className="pb-3 px-4">Telefon</th><th className="pb-3 px-4 text-right">Handling</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPersons.map(person => (
                  <tr key={person.id} onClick={() => setSelectedPersonId(person.id)} className="group hover:bg-indigo-50/50 transition-colors cursor-pointer">
                    <td className="py-4 px-4 font-bold text-sm text-slate-800 group-hover:text-indigo-700">{person.name}</td>
                    <td className="py-4 px-4"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getCoreRoleColor(person.core_role)}`}>{getCoreRoleLabel(person.core_role)}</span></td>
                    <td className="py-4 px-4 text-[11px] text-slate-500">{person.email}</td>
                    <td className="py-4 px-4 text-[11px] text-slate-500">{person.phone || '-'}</td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>{isAdmin && (<div className="flex justify-end gap-1"><button onClick={() => setEditingPerson(person)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 rounded-lg transition-colors"><Edit2 size={14} /></button><button onClick={() => handleDeletePerson(person.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-100 rounded-lg transition-colors"><Trash2 size={14} /></button></div>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={() => { setNewGroupCategory(activeTab as GroupCategory); setIsCreateModalOpen(true); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"><Plus size={16} /> Ny Gruppe</button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => {
              const members = db.groupMembers.filter(gm => gm.group_id === group.id);
              const leaders = members.filter(m => m.role === GroupRole.LEADER).map(m => db.persons.find(p => p.id === m.person_id)?.name).filter(Boolean);
              return (
                <button 
                  key={group.id} 
                  onClick={() => setViewingGroupId(group.id)}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group relative flex flex-col h-full text-left cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 text-left"><div className="p-2 bg-slate-50 rounded-lg">{getIcon(group.category)}</div><h3 className="text-base font-bold text-slate-800">{group.name}</h3></div>
                    {isAdmin && (<button onClick={(e) => { e.stopPropagation(); setManageGroupId(group.id); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 bg-slate-50 rounded-lg transition-all" title="Administrer gruppe"><Edit2 size={16} /></button>)}
                  </div>
                  <p className="text-slate-500 text-xs mb-4 flex-grow line-clamp-2">{group.description || 'Ingen beskrivelse.'}</p>
                  <div className="pt-4 border-t space-y-2 w-full"><div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{members.length} medlemmer</span></div><div className="flex items-center gap-1.5 overflow-hidden"><Star size={10} className="text-amber-500 fill-amber-500 shrink-0" /><p className="text-[10px] font-bold text-slate-600 truncate">Leder: {leaders.length > 0 ? leaders.join(', ') : 'Ingen valgt'}</p></div></div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Administrer Gruppe Modal */}
      {managedGroup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setManageGroupId(null)}></div>
          <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 shrink-0"><div className="flex items-center gap-3 text-left"><div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">{getIcon(managedGroup.category)}</div><div><h3 className="text-lg font-bold text-slate-900 leading-none">Administrer {managedGroup.name}</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Konfigurasjon & Team</p></div></div><button onClick={() => setManageGroupId(null)} className="p-2.5 hover:bg-slate-200 rounded-xl transition-colors"><X size={24} /></button></div>
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 p-8 border-r overflow-y-auto space-y-8 bg-white text-left">
                <section className="space-y-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grunninfo</h4>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gruppenavn</label><input type="text" value={managedGroup.name} onChange={e => handleUpdateGroupBasicInfo({ name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Beskrivelse</label><textarea value={managedGroup.description || ''} onChange={e => handleUpdateGroupBasicInfo({ description: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lenke / URL (Facebook e.l.)</label><div className="flex gap-2"><div className="p-3 bg-slate-100 rounded-xl text-slate-400"><LinkIcon size={16}/></div><input type="url" value={managedGroup.link || ''} onChange={e => handleUpdateGroupBasicInfo({ link: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." /></div></div>
                </section>
                <section className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Repeat size={14} /> Samlingsplanlegging</h4>
                  <div className="space-y-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100"><div className="space-y-2"><label className="text-[9px] font-bold text-slate-400 uppercase">Frekvens</label><div className="flex gap-2"><select value={tempPattern?.interval} onChange={e => handleUpdateGatheringPattern({ interval: parseInt(e.target.value) })} className="flex-1 p-2 bg-white border rounded-lg text-xs font-bold"><option value={1}>Hver uke</option><option value={2}>Hver 2. uke</option><option value={3}>Hver 3. uke</option><option value={4}>Hver 4. uke</option></select></div></div><div className="space-y-2"><label className="text-[9px] font-bold text-slate-400 uppercase">Ukedag</label><select value={tempPattern?.day_of_week} onChange={e => handleUpdateGatheringPattern({ day_of_week: parseInt(e.target.value) })} className="w-full p-2 bg-white border rounded-lg text-xs font-bold">{['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'].map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div><button onClick={handleSyncToCalendar} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-2"><Calendar size={14} /> Synkroniser {syncCount} samlinger</button></div>
                </section>
              </div>
              <div className="flex-1 p-8 bg-slate-50 overflow-y-auto space-y-6 text-left">
                <section className="space-y-4">
                  <div className="flex justify-between items-center"><h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Medlemmer & Tjenester</h4><span className="text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">{db.groupMembers.filter(gm => gm.group_id === managedGroup.id).length} totalt</span></div>
                  <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Søk og legg til person..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-indigo-500" />{memberSearch && memberSearchResults.length > 0 && (<div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">{memberSearchResults.map(p => (<button key={p.id} onClick={() => { handleAddMember(p.id); setMemberSearch(''); }} className="w-full px-5 py-3 flex items-center justify-between hover:bg-indigo-50 border-b border-slate-50 last:border-0 text-left transition-colors"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">{p.name.charAt(0)}</div><span className="text-xs font-bold text-slate-700">{p.name}</span></div><Plus size={16} className="text-indigo-500" /></button>))}</div>)}</div>
                  <div className="space-y-3">{db.groupMembers.filter(gm => gm.group_id === managedGroup.id).map(gm => { const person = db.persons.find(p => p.id === gm.person_id); const isLeader = gm.role === GroupRole.LEADER; return (<div key={gm.id} className={`flex items-center gap-4 p-4 bg-white border rounded-2xl shadow-sm transition-all ${isLeader ? 'border-amber-400 bg-amber-50/10' : 'border-slate-200'}`}><div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-xs border border-slate-100">{person?.name.charAt(0)}</div><div className="flex-1 min-w-0"><p className="font-bold text-slate-800 text-sm truncate">{person?.name}</p><div className="flex items-center gap-2 mt-1"><button onClick={() => handleToggleLeader(gm.id)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all border ${isLeader ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-200 hover:text-amber-500'}`}><Star size={12} className={isLeader ? 'fill-amber-500' : ''} /> Gruppeleder</button></div></div><div className="flex items-center gap-3"><div className="relative group/role"><select value={gm.service_role_id || ''} onChange={e => handleUpdateMemberRole(gm.id, e.target.value || null)} className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none appearance-none hover:bg-indigo-50 transition-colors cursor-pointer min-w-[140px]"><option value="">Tildel tjeneste-rolle...</option>{db.serviceRoles.map(sr => <option key={sr.id} value={sr.id}>{sr.name}</option>)}</select><ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div><button onClick={() => handleRemoveMember(gm.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button></div></div>); })}</div>
                </section>
              </div>
            </div>
            <div className="px-8 py-5 border-t bg-slate-50 flex justify-end shrink-0"><button onClick={() => setManageGroupId(null)} className="px-12 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xl hover:bg-slate-800 transition-all">Lukk & Ferdig</button></div>
          </div>
        </div>
      )}

      {/* Vis Gruppe Modal (Read-Only) */}
      {viewedGroup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingGroupId(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 text-left max-h-[85vh]">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-white shrink-0"><div className="flex items-center gap-3"><div className="p-2.5 bg-indigo-50 rounded-xl">{getIcon(viewedGroup.category)}</div><div><h3 className="text-xl font-bold text-slate-900 leading-tight">{viewedGroup.name}</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{viewedGroup.category}</p></div></div><button onClick={() => setViewingGroupId(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} className="text-slate-500" /></button></div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              {viewedGroup.description && (<section><h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Om gruppen</h4><p className="text-sm text-slate-600 leading-relaxed">{viewedGroup.description}</p></section>)}
              {viewedGroup.link && (<section><h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lenker & Ressurser</h4><a href={viewedGroup.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"><ExternalLink size={14} /> Gå til gruppens område</a></section>)}
              <section className="space-y-4"><h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={14} /> Medlemmer & Funksjoner</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{db.groupMembers.filter(gm => gm.group_id === viewedGroup.id).map(gm => { const person = db.persons.find(p => p.id === gm.person_id); const role = db.serviceRoles.find(r => r.id === gm.service_role_id); return (<div key={gm.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm">{person?.name.charAt(0)}</div><div className="flex-1 min-w-0"><p className="font-bold text-slate-800 text-xs truncate">{person?.name}</p><p className={`text-[9px] uppercase font-bold ${gm.role === GroupRole.LEADER ? 'text-amber-500' : 'text-slate-400'}`}>{gm.role === GroupRole.LEADER ? 'Leder' : role?.name || 'Medlem'}</p></div>{gm.role === GroupRole.LEADER && <Star size={12} className="text-amber-500 fill-amber-500" />}</div>); })}</div></section>
              {viewedGroup.gathering_pattern && (<section className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl"><h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-3"><Repeat size={14} /> Samlingsplan</h4><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-indigo-600"><Calendar size={18} /></div><div><p className="text-xs font-bold text-slate-800">{viewedGroup.gathering_pattern.frequency_type === 'weeks' ? `Hver ${viewedGroup.gathering_pattern.interval === 1 ? '' : viewedGroup.gathering_pattern.interval + '. '}uke` : `Hver ${viewedGroup.gathering_pattern.interval === 1 ? '' : viewedGroup.gathering_pattern.interval + '. '}måned`}</p><p className="text-[10px] text-slate-500 font-medium">Fast dag: {['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'][viewedGroup.gathering_pattern.day_of_week]}</p></div></div></section>)}
            </div>
            <div className="p-6 border-t bg-white flex justify-end shrink-0"><button onClick={() => setViewingGroupId(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-colors">Lukk</button></div>
          </div>
        </div>
      )}

      {/* Vis/Rediger Rolle Modal */}
      {viewedRole && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingRoleId(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 text-left max-h-[90vh]">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-indigo-700 text-white shrink-0">
              <div className="flex items-center gap-3"><Library size={24} /><div><h3 className="text-lg font-bold leading-tight">{viewedRole.name}</h3><p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">Instruks & Detaljer</p></div></div>
              <button onClick={() => setViewingRoleId(null)} className="p-1 hover:bg-indigo-600 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateRole} className="flex-1 overflow-y-auto p-8 space-y-6">
              {isAdmin ? (
                <>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rollenavn</label><input required name="name" defaultValue={viewedRole.name} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm font-bold" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Beskrivelse</label><textarea name="description" defaultValue={viewedRole.description || ''} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm h-24" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Standard Instrukser (per linje)</label><textarea name="instructions" defaultValue={viewedRole.default_instructions.join('\n')} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm h-48 font-medium" /></div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">Lagre Endringer</button>
                </>
              ) : (
                <div className="space-y-6">
                  {viewedRole.description && (<div><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Om rollen</h4><p className="text-sm text-slate-600 leading-relaxed">{viewedRole.description}</p></div>)}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ListChecks size={14}/> Sjekkliste / Instrukser</h4>
                    <div className="space-y-3">
                      {viewedRole.default_instructions.map((inst, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium"><div className="w-5 h-5 rounded-full border-2 border-indigo-200 shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-400">{i+1}</div>{inst}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </form>
            {!isAdmin && (
              <div className="p-6 border-t bg-slate-50 shrink-0 flex justify-end"><button onClick={() => setViewingRoleId(null)} className="px-8 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs">Lukk</button></div>
            )}
          </div>
        </div>
      )}

      {/* Ny Gruppe Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div><div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-left animate-in zoom-in-95"><div className="p-6 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-xl font-bold">Opprett ny Gruppe</h3><button onClick={() => setIsCreateModalOpen(false)}><X size={24} /></button></div><form onSubmit={handleCreateGroup} className="p-8 space-y-6"><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Navn på gruppe / team</label><input autoFocus required type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="f.eks. Lovsangsteam 1..." /></div><button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Plus size={20} /> Opprett Gruppe</button></form></div></div>
      )}

      {/* Ny Katalogrolle Modal */}
      {isCreateServiceRoleModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateServiceRoleModalOpen(false)}></div><div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-left animate-in zoom-in-95"><div className="p-6 bg-indigo-700 text-white flex justify-between items-center"><h3 className="text-xl font-bold">Ny Katalogrolle</h3><button onClick={() => setIsCreateServiceRoleModalOpen(false)}><X size={24} /></button></div><form onSubmit={handleCreateServiceRole} className="p-8 space-y-4"><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Navn</label><input autoFocus required name="name" type="text" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="f.eks. Møteleder" /></div><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Beskrivelse</label><textarea name="description" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24" placeholder="Beskrivelse..." /></div><div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Instrukser (per linje)</label><textarea name="instructions" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-32" /></div><button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Opprett Rolle</button></form></div></div>
      )}
      
      {/* Rediger Person Modal */}
      {editingPerson && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingPerson(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Rediger Medlem</h3>
              <button onClick={() => setEditingPerson(null)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdatePerson} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fullt Navn</label>
                <input required name="name" type="text" defaultValue={editingPerson.name} className="w-full px-4 py-3 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-post</label>
                <input required name="email" type="email" defaultValue={editingPerson.email} className="w-full px-4 py-3 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telefon</label>
                <input name="phone" type="tel" defaultValue={editingPerson.phone} className="w-full px-4 py-3 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kjernelogikk-Rolle</label>
                <select name="core_role" defaultValue={editingPerson.core_role} className="w-full px-4 py-3 border rounded-xl text-sm">
                  <option value={CoreRole.ADMIN}>Administrator</option>
                  <option value={CoreRole.PASTOR}>Pastor</option>
                  <option value={CoreRole.TEAM_LEADER}>Gruppeleder</option>
                  <option value={CoreRole.MEMBER}>Medlem</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg mt-4">Lagre Endringer</button>
            </form>
          </div>
        </div>
      )}
      
      {/* Ny Person Modal */}
      {isCreatePersonModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreatePersonModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Legg til nytt medlem</h3>
              <button onClick={() => setIsCreatePersonModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreatePerson} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fullt Navn</label>
                <input required name="name" type="text" className="w-full px-4 py-3 border rounded-xl text-sm" placeholder="Navn..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-post</label>
                <input required name="email" type="email" className="w-full px-4 py-3 border rounded-xl text-sm" placeholder="epost@eksempel.no" />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg mt-4">Legg til</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsView;
