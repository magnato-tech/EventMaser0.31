
import React, { useState, useMemo } from 'react';
import { AppState, Person, GroupCategory, ServiceRole, Assignment, UUID, EventOccurrence, Task, ProgramItem } from '../types';
import { Calendar, Users, Bell, ArrowRight, X, CheckCircle2, Shield, Clock, AlertCircle, ListChecks, ChevronRight } from 'lucide-react';

interface Props {
  db: AppState;
  currentUser: Person;
  onGoToWheel?: () => void;
  onViewGroup: (groupId: UUID) => void;
}

const Dashboard: React.FC<Props> = ({ db, currentUser, onGoToWheel, onViewGroup }) => {
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<UUID | null>(null);

  const myAssignments = useMemo(() => {
    return db.assignments
      .filter(a => a.person_id === currentUser.id && a.occurrence_id)
      .map(a => {
        const occ = db.eventOccurrences.find(o => o.id === a.occurrence_id);
        const role = db.serviceRoles.find(r => r.id === a.service_role_id);
        return { ...a, occurrence: occ, role };
      })
      .filter((a): a is typeof a & { occurrence: EventOccurrence } => !!a.occurrence)
      .sort((a, b) => new Date(a.occurrence.date).getTime() - new Date(b.occurrence.date).getTime());
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
      .sort((a, b) => new Date(a.occurrence.date).getTime() - new Date(b.occurrence.date).getTime());
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
    return Array.from(ids).map(id => db.eventOccurrences.find(o => o.id === id)!).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 md:pb-8 animate-in fade-in duration-300 text-left">
      <header className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Velkommen, {currentUser.name.split(' ')[0]}</h2>
        <p className="text-sm text-slate-500 font-medium">Operativ oversikt over dine ansvarsområder.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hovedfelt: Arrangementer */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Calendar className="text-indigo-600" size={18} /> Planlagte vakter
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded">{uniqueInvolvedEvents.length} arrangementer</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {uniqueInvolvedEvents.length > 0 ? uniqueInvolvedEvents.map(occ => {
                const myRolesForThis = myAssignments.filter(a => a.occurrence.id === occ.id);
                const myProgramPosts = myProgramItems.filter(p => p.occurrence.id === occ.id);
                
                return (
                  <button key={occ.id} onClick={() => setSelectedOccurrenceId(occ.id)} className="w-full text-left p-4 hover:bg-slate-50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-600 border border-slate-200 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                        <span className="text-[9px] font-bold uppercase leading-none mb-0.5">{new Intl.DateTimeFormat('no-NO', { month: 'short' }).format(new Date(occ.date))}</span>
                        <span className="text-lg font-bold leading-none">{new Date(occ.date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate">{occ.title_override || db.eventTemplates.find(t => t.id === occ.template_id)?.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                           {myRolesForThis.map(a => (
                             <span key={a.id} className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded flex items-center gap-1">
                               <Shield size={10} /> {a.role?.name || 'Vakt'}
                             </span>
                           ))}
                           {myProgramPosts.map(p => (
                             <span key={p.id} className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                               <CheckCircle2 size={10} /> {p.title}
                             </span>
                           ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
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
        </div>

        {/* Sidepanel: Frister & Teams */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
              <Bell className="text-indigo-400" size={18} />
              <h3 className="text-sm font-bold text-white">Viktige frister</h3>
            </div>
            <div className="p-4 space-y-3">
              {myTasks.length > 0 ? myTasks.map(task => (
                <div key={task.id} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700 hover:border-indigo-500/30 transition-all group">
                  <p className="text-xs font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{task.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {new Intl.DateTimeFormat('no-NO', { day: 'numeric', month: 'short' }).format(new Date(task.deadline))}
                    </span>
                    {task.occurrence && <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-tighter">{task.occurrence.title_override}</span>}
                  </div>
                </div>
              )) : (
                <p className="text-center py-4 text-xs text-slate-500">Ingen utestående frister.</p>
              )}
              {onGoToWheel && (
                <button onClick={onGoToWheel} className="w-full mt-2 py-2 text-[10px] font-bold text-indigo-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  Vis årshjul <ArrowRight size={12} />
                </button>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
              <Users className="text-slate-400" size={18} />
              <h3 className="text-sm font-bold text-slate-800">Mine Teams</h3>
            </div>
            <div className="p-2 space-y-1">
              {db.groupMembers.filter(gm => gm.person_id === currentUser.id).map(gm => {
                const group = db.groups.find(g => g.id === gm.group_id);
                if (!group) return null;
                return (
                  <button key={group.id} onClick={() => onViewGroup(group.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${group.category === GroupCategory.SERVICE ? 'bg-indigo-500' : 'bg-teal-500'}`}></div>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600">{group.name}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Detalj-Modal: Enterprise Layout */}
      {selectedOccurrenceId && selectedOcc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => setSelectedOccurrenceId(null)}></div>
          <div className="relative bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="text-left">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{new Intl.DateTimeFormat('no-NO', { dateStyle: 'full' }).format(new Date(selectedOcc.date))}</span>
                <h3 className="text-lg font-bold text-slate-900 leading-tight mt-1">{selectedOcc.title_override || db.eventTemplates.find(t => t.id === selectedOcc.template_id)?.title}</h3>
              </div>
              <button onClick={() => setSelectedOccurrenceId(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8 bg-white">
              {/* Venstre: Min rolle & Team */}
              <div className="md:col-span-5 space-y-6">
                <section className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-lg">
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={14}/> Mine instrukser</h4>
                  <div className="space-y-6">
                    {myAssignments.filter(a => a.occurrence.id === selectedOccurrenceId).map(a => (
                      <div key={a.id}>
                        <p className="text-lg font-bold text-slate-900 mb-3">{a.role?.name}</p>
                        <div className="space-y-2">
                          {a.role?.default_instructions.map((inst, i) => (
                            <div key={i} className="flex gap-3 text-left">
                              <div className="mt-1 w-4 h-4 rounded border border-indigo-300 bg-white flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">{i+1}</div>
                              <p className="text-slate-700 font-medium text-xs leading-relaxed">{inst}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={14}/> Teamet for dagen</h4>
                   <div className="space-y-1.5">
                     {db.assignments.filter(a => a.occurrence_id === selectedOccurrenceId && a.person_id).map(a => {
                       const person = db.persons.find(p => p.id === a.person_id);
                       const role = db.serviceRoles.find(r => r.id === a.service_role_id);
                       if (!person) return null;
                       return (
                         <div key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${a.person_id === currentUser.id ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${a.person_id === currentUser.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{person.name.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 truncate">{person.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{role?.name}</p>
                            </div>
                         </div>
                       )
                     })}
                   </div>
                </section>
              </div>

              {/* Høyre: Kjøreplan */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Clock size={14}/> Kjøreplan</h4>
                <div className="space-y-1.5">
                  {programWithTimes.map(item => {
                    const responsible = item.service_role_id ? db.serviceRoles.find(r => r.id === item.service_role_id)?.name : item.group_id ? db.groups.find(g => g.id === item.group_id)?.name : null;
                    const isMyItem = item.person_id === currentUser.id;
                    return (
                      <div key={item.id} className={`flex items-center gap-4 p-3 rounded-lg border text-sm transition-all ${isMyItem ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex flex-col items-center shrink-0 w-12 border-r border-current opacity-60">
                           <span className="text-[11px] font-bold">{item.formattedTime}</span>
                           <span className="text-[9px] font-medium">{item.duration_minutes}m</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <h5 className="font-bold truncate">{item.title}</h5>
                           {responsible && (<p className={`text-[9px] font-bold uppercase opacity-70 mt-0.5`}>{responsible}</p>)}
                        </div>
                      </div>
                    )
                  })}
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
