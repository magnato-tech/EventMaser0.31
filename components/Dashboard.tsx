
import React, { useState, useMemo } from 'react';
import { AppState, Person, GroupCategory, ServiceRole, Assignment, UUID, EventOccurrence, Task, ProgramItem } from '../types';
import { Calendar, Users, Bell, ArrowRight, X, CheckCircle2, Shield, Clock, AlertCircle, ListChecks, ChevronRight } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useMembers } from '../hooks/useMembers';
import LillesandMap from './dashboard/LillesandMap';
import StatCards from './dashboard/StatCards';
import FilterBar, { DashboardFilters } from './dashboard/FilterBar';
import { DashboardSkeleton } from './dashboard/DashboardSkeleton';

// Hjelpefunksjon for å parse datoer i lokal tid (Berlin time)
const parseLocalDate = (dateString: string): Date => {
  // dateString er i format "YYYY-MM-DD"
  const [year, month, day] = dateString.split('-').map(Number);
  // Opprett dato i lokal tid (Berlin time)
  return new Date(year, month - 1, day);
};

interface Props {
  db: AppState;
  currentUser: Person;
  onGoToWheel?: () => void;
  onViewGroup: (groupId: UUID) => void;
}

const Dashboard: React.FC<Props> = ({ db, currentUser, onGoToWheel, onViewGroup }) => {
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<UUID | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>({
    status: 'all',
    gender: 'all',
    ageGroup: 'all'
  });

  const myAssignments = useMemo(() => {
    return db.assignments
      .filter(a => a.person_id === currentUser.id && a.occurrence_id)
      .map(a => {
        const occ = db.eventOccurrences.find(o => o.id === a.occurrence_id);
        const role = db.serviceRoles.find(r => r.id === a.service_role_id);
        return { ...a, occurrence: occ, role };
      })
      .filter((a): a is typeof a & { occurrence: EventOccurrence } => !!a.occurrence)
      .sort((a, b) => parseLocalDate(a.occurrence.date).getTime() - parseLocalDate(b.occurrence.date).getTime());
  }, [db.assignments, db.eventOccurrences, currentUser.id]);

  const myProgramItems = useMemo(() => {
    return db.programItems
      .filter(p => p.person_id === currentUser.id && p.occurrence_id)
      .map(p => {
        const occ = db.eventOccurrences.find(o => o.id === p.occurrence_id);
        const role = p.service_role_id ? db.serviceRoles.find(r => r.id === p.service_role_id) : undefined;
        return { ...p, occurrence: occ, role };
      })
      .filter((p): p is typeof p & { occurrence: EventOccurrence } => !!p.occurrence)
      .sort((a, b) => parseLocalDate(a.occurrence.date).getTime() - parseLocalDate(b.occurrence.date).getTime());
  }, [db.programItems, db.eventOccurrences, currentUser.id]);

  const myTasks = useMemo(() => {
    return db.tasks
      .filter(t => t.responsible_id === currentUser.id)
      .map(t => {
         const occ = t.occurrence_id ? db.eventOccurrences.find(o => o.id === t.occurrence_id) : null;
         return { ...t, occurrence: occ };
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [db.tasks, db.eventOccurrences, currentUser.id]);

  const uniqueInvolvedEvents = useMemo(() => {
    const ids = new Set([
      ...myAssignments.map(a => a.occurrence.id),
      ...myProgramItems.map(p => p.occurrence.id)
    ]);
    return Array.from(ids).map(id => db.eventOccurrences.find(o => o.id === id)!).sort((a,b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
  }, [myAssignments, myProgramItems, db.eventOccurrences]);

  const selectedOcc = db.eventOccurrences.find(o => o.id === selectedOccurrenceId);

  const formatTimeFromOffset = (offsetMinutes: number) => {
    const baseHour = 11;
    const baseMinute = 0;
    const totalMinutes = baseHour * 60 + baseMinute + offsetMinutes;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = Math.floor(totalMinutes % 60);
    return `${h.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`;
  };

  const programWithTimes = useMemo(() => {
    if (!selectedOccurrenceId) return [];
    const items = db.programItems
      .filter(p => p.occurrence_id === selectedOccurrenceId)
      .sort((a, b) => a.order - b.order);
    let currentOffset = 0;
    return items.map((item, idx) => {
      let startTimeOffset = currentOffset;
      if (idx === 0 && item.order === 0) startTimeOffset = -item.duration_minutes;
      const formattedTime = formatTimeFromOffset(startTimeOffset);
      if (idx === 0 && item.order === 0) currentOffset = 0;
      else currentOffset += item.duration_minutes;
      return { ...item, formattedTime };
    });
  }, [selectedOccurrenceId, db.programItems]);

  // Fetch members data (async-ready, currently using mock)
  const { data: membersData, loading: membersLoading, error: membersError } = useMembers({ mockData: db });

  // Hent statistikk fra custom hook med filtre
  const stats = useDashboardStats({
    persons: membersData ?? null,
    groupMembers: db.groupMembers,
    groups: db.groups,
    filters
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 md:pb-8 animate-in fade-in duration-300 text-left">
      <header className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Velkommen, {currentUser.firstName}</h2>
        <p className="text-sm text-slate-500 font-medium">Operativ oversikt over dine ansvarsområder.</p>
      </header>

      {/* Filter bar */}
      <FilterBar filters={filters} onFilterChange={setFilters} />

      {/* Loading state - show skeleton loaders */}
      {membersLoading && <DashboardSkeleton />}

      {/* Error state */}
      {membersError && !membersLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-rose-900 mb-1">Feil ved henting av data</h3>
              <p className="text-xs text-rose-700">{membersError.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content - only show when not loading and no error */}
      {!membersLoading && !membersError && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hovedfelt: Arrangementer */}
          <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Calendar className="text-primary-600" size={18} /> Planlagte vakter
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded">{uniqueInvolvedEvents.length} arrangementer</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {uniqueInvolvedEvents.length > 0 ? uniqueInvolvedEvents.map(occ => {
                const myRolesForThis = myAssignments.filter(a => a.occurrence.id === occ.id);
                const myProgramPosts = myProgramItems.filter(p => p.occurrence.id === occ.id);
                
                // Grupper rollene unikt - samme rolle skal kun vises én gang per arrangement
                const uniqueRoles = new Map<string, typeof myRolesForThis[0]>();
                myRolesForThis.forEach(a => {
                  if (a.role) {
                    const roleKey = `${occ.id}-${a.role.id}`;
                    if (!uniqueRoles.has(roleKey)) {
                      uniqueRoles.set(roleKey, a);
                    }
                  }
                });
                const uniqueRolesArray = Array.from(uniqueRoles.values());
                
                return (
                  <button key={occ.id} onClick={() => setSelectedOccurrenceId(occ.id)} className="w-full text-left p-4 hover:bg-slate-50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-600 border border-slate-200 group-hover:border-primary-200 group-hover:text-primary-600 transition-colors shrink-0">
                        <span className="text-[9px] font-bold uppercase leading-none mb-0.5">{new Intl.DateTimeFormat('no-NO', { month: 'short' }).format(parseLocalDate(occ.date))}</span>
                        <span className="text-lg font-bold leading-none">{parseLocalDate(occ.date).getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate mb-1.5">{occ.title_override || db.eventTemplates.find(t => t.id === occ.template_id)?.title}</h4>
                        {/* Unike roller først */}
                        {uniqueRolesArray.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {uniqueRolesArray.map(a => (
                              <span key={`role-${occ.id}-${a.role?.id}`} className="text-[9px] font-semibold text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <Shield size={10} /> {a.role?.name || 'Vakt'}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Programposter på egne linjer under rollene */}
                        {myProgramPosts.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {myProgramPosts.map(p => (
                              <span key={p.id} className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 size={10} /> {p.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0 ml-2" />
                  </button>
                );
              }) : (
                <div className="p-12 text-center text-slate-400">
                  <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-medium">Ingen kommende vakter registrert på din profil.</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
              <Users className="text-slate-400" size={18} />
              <h3 className="text-sm font-bold text-slate-800">Mine grupper</h3>
            </div>
            <div className="p-2 space-y-1">
              {db.groupMembers.filter(gm => gm.person_id === currentUser.id).map(gm => {
                const group = db.groups.find(g => g.id === gm.group_id);
                if (!group) return null;
                return (
                  <button key={group.id} onClick={() => onViewGroup(group.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${group.category === GroupCategory.SERVICE ? 'bg-primary-500' : 'bg-teal-500'}`}></div>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-primary-600">{group.name}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Statistikk-kort og demografisk oversikt */}
          <StatCards
            totalPersons={stats.totalPersons}
            activePersons={stats.activePersons}
            personsInService={stats.personsInService}
            percentInService={stats.percentInService}
            demographicData={stats.demographicData}
            maxCount={stats.maxCount}
            isEmpty={stats.isEmpty}
          />

          {/* Geografisk utbredelse */}
          <LillesandMap
            points={stats.mapPoints}
            maxPostalCodeCount={stats.maxPostalCodeCount}
            isEmpty={stats.isEmpty}
          />
        </div>

        {/* Sidepanel: Frister */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
              <Bell className="text-primary-400" size={18} />
              <h3 className="text-sm font-bold text-white">Viktige frister</h3>
            </div>
            <div className="p-4 space-y-3">
              {myTasks.length > 0 ? myTasks.map(task => (
                <div key={task.id} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700 hover:border-primary-500/30 transition-all group">
                  <p className="text-xs font-bold text-white mb-1 group-hover:text-primary-300 transition-colors">{task.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {new Intl.DateTimeFormat('no-NO', { day: 'numeric', month: 'short' }).format(new Date(task.deadline))}
                    </span>
                    {task.occurrence && <span className="text-[9px] font-bold text-primary-400/80 uppercase tracking-tighter">{task.occurrence.title_override}</span>}
                  </div>
                </div>
              )) : (
                <p className="text-center py-4 text-xs text-slate-500">Ingen utestående frister.</p>
              )}
              {onGoToWheel && (
                <button onClick={onGoToWheel} className="w-full mt-2 py-2 text-[10px] font-bold text-primary-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  Vis årshjul <ArrowRight size={12} />
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
      )}

      {/* Detalj-Modal: Enterprise Layout */}
      {selectedOccurrenceId && selectedOcc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => setSelectedOccurrenceId(null)}></div>
          <div className="relative bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="text-left">
                <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{new Intl.DateTimeFormat('no-NO', { dateStyle: 'full' }).format(parseLocalDate(selectedOcc.date))}</span>
                <h3 className="text-lg font-bold text-slate-900 leading-tight mt-1">{selectedOcc.title_override || db.eventTemplates.find(t => t.id === selectedOcc.template_id)?.title}</h3>
                {selectedOcc.theme && (
                  <p className="text-sm text-slate-600 italic mt-2">{selectedOcc.theme}</p>
                )}
              </div>
              <button onClick={() => setSelectedOccurrenceId(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {/* Kjøreplan - flyttet til toppen */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Clock size={14}/> Kjøreplan</h4>
                <div className="space-y-1.5">
                  {programWithTimes.map(item => {
                    const responsible = item.service_role_id ? db.serviceRoles.find(r => r.id === item.service_role_id)?.name : item.group_id ? db.groups.find(g => g.id === item.group_id)?.name : null;
                    const responsiblePerson = item.person_id ? db.persons.find(p => p.id === item.person_id) : null;
                    const isMyItem = item.person_id === currentUser.id;
                    return (
                      <div key={item.id} className={`flex items-center gap-4 p-3 rounded-lg border text-sm transition-all ${isMyItem ? 'bg-primary-600 border-primary-700 text-white' : 'bg-slate-50 border-slate-100'}`}>
                        {item.duration_minutes > 0 && (
                          <div className="flex flex-col items-center shrink-0 w-12 border-r border-current opacity-60">
                             <span className="text-[11px] font-bold">{item.formattedTime}</span>
                             <span className="text-[9px] font-medium">{item.duration_minutes}m</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                           <h5 className="font-bold truncate">{item.title}</h5>
                           {item.description && item.description.trim() && (
                             <p className={`text-xs italic mt-1 mb-1 ${isMyItem ? 'text-primary-100' : 'text-slate-500'}`}>{item.description}</p>
                           )}
                           <div className="flex flex-wrap items-center gap-2 mt-1.5">
                             {responsible && (
                               <span className={`text-[9px] font-bold uppercase opacity-70 px-2 py-0.5 rounded ${isMyItem ? 'bg-primary-500/30' : 'bg-slate-200'}`}>
                                 {responsible}
                               </span>
                             )}
                             {responsiblePerson && (
                               <span className={`text-[9px] font-semibold ${isMyItem ? 'text-primary-100' : 'text-slate-600'}`}>
                                 Ansvarlig: {responsiblePerson.firstName} {responsiblePerson.lastName}
                               </span>
                             )}
                           </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Resten av seksjonene i grid-layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Venstre: Min rolle & Team */}
                <div className="space-y-6">
                  <section className="bg-primary-50/50 border border-primary-100 p-5 rounded-lg">
                    <h4 className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={14}/> Mine instrukser</h4>
                    <div className="space-y-6">
                      {(() => {
                        // Grupper assignments unikt per rolle for å unngå duplikater
                        const assignmentsForOcc = myAssignments.filter(a => a.occurrence.id === selectedOccurrenceId);
                        const uniqueRolesInModal = new Map<string, typeof assignmentsForOcc[0]>();
                        assignmentsForOcc.forEach(a => {
                          if (a.role) {
                            const roleKey = a.role.id;
                            if (!uniqueRolesInModal.has(roleKey)) {
                              uniqueRolesInModal.set(roleKey, a);
                            }
                          }
                        });
                        return Array.from(uniqueRolesInModal.values()).map(a => (
                          <div key={a.role?.id || a.id}>
                            <p className="text-lg font-bold text-slate-900 mb-3">{a.role?.name}</p>
                            <div className="space-y-2">
                              {a.role?.default_instructions.map((inst, i) => (
                                <div key={i} className="flex gap-3 text-left">
                                  <div className="mt-1 w-4 h-4 rounded border border-primary-300 bg-white flex items-center justify-center text-[10px] font-bold text-primary-600 shrink-0">{i+1}</div>
                                  <p className="text-slate-700 font-medium text-xs leading-relaxed">{inst}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </section>

                  {/* Roller med ansvarlig person - unike kombinasjoner */}
                  {(() => {
                    const programItemsForOcc = db.programItems.filter(
                      p => p.occurrence_id === selectedOccurrenceId && p.service_role_id && p.person_id
                    );
                    
                    // Lag unike kombinasjoner av rolle + person
                    const uniqueRolePersonCombos = new Map<string, { role: ServiceRole; person: Person }>();
                    programItemsForOcc.forEach(item => {
                      if (item.service_role_id && item.person_id) {
                        const role = db.serviceRoles.find(r => r.id === item.service_role_id);
                        const person = db.persons.find(p => p.id === item.person_id);
                        if (role && person) {
                          // Bruk rolle_id + person_id som nøkkel for unikhet
                          const key = `${role.id}-${person.id}`;
                          if (!uniqueRolePersonCombos.has(key)) {
                            uniqueRolePersonCombos.set(key, { role, person });
                          }
                        }
                      }
                    });
                    
                    const uniqueCombos = Array.from(uniqueRolePersonCombos.values());
                    
                    if (uniqueCombos.length > 0) {
                      return (
                        <section className="bg-slate-50 border border-slate-200 p-5 rounded-lg">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Shield size={14}/> Bemanning
                          </h4>
                          <div className="space-y-2">
                            {uniqueCombos.map(({ role, person }, idx) => (
                              <div key={`${role.id}-${person.id}-${idx}`} className="flex items-center gap-3 p-2.5 rounded-lg border bg-white border-slate-200">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] bg-primary-100 text-primary-700 border border-primary-200">
                                  {person.firstName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-800 truncate">{person.firstName} {person.lastName}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{role.name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Høyre: Teamet for dagen */}
                <div>
                  <section>
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={14}/> Teamet for dagen</h4>
                     <div className="space-y-1.5">
                       {db.assignments.filter(a => a.occurrence_id === selectedOccurrenceId && a.person_id).map(a => {
                         const person = db.persons.find(p => p.id === a.person_id);
                         const role = db.serviceRoles.find(r => r.id === a.service_role_id);
                         if (!person) return null;
                         return (
                           <div key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${a.person_id === currentUser.id ? 'bg-primary-50 border-primary-100' : 'bg-slate-50 border-slate-100'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${a.person_id === currentUser.id ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{person.firstName.charAt(0)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">{person.firstName} {person.lastName}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{role?.name}</p>
                              </div>
                           </div>
                         )
                       })}
                     </div>
                  </section>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t flex justify-end shrink-0">
              <button onClick={() => setSelectedOccurrenceId(null)} className="px-8 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-slate-800">Lukk</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
