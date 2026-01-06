
import React, { useState, useMemo } from 'react';
import { AppState, Person, GroupCategory, ServiceRole, Assignment, UUID, EventOccurrence, Task, ProgramItem } from '../types';
import { Calendar, Users, Bell, ArrowRight, X, CheckCircle2, Shield, Clock, AlertCircle, ListChecks } from 'lucide-react';

interface Props {
  db: AppState;
  currentUser: Person;
  onGoToWheel?: () => void;
  onViewGroup: (groupId: UUID) => void;
}

const Dashboard: React.FC<Props> = ({ db, currentUser, onGoToWheel, onViewGroup }) => {
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<UUID | null>(null);

  // Mine kommende vakter (Hovedroller i kalenderen)
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

  // Mine programposter (Kjøreplan-ansvar)
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

  // Mine oppgaver (Deadline-baserte oppgaver fra årshjul eller arrangement)
  const myTasks = useMemo(() => {
    return db.tasks
      .filter(t => t.responsible_id === currentUser.id)
      .map(t => {
         const occ = t.occurrence_id ? db.eventOccurrences.find(o => o.id === t.occurrence_id) : null;
         return { ...t, occurrence: occ };
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [db.tasks, db.eventOccurrences, currentUser.id]);

  // Kombinerer arrangementer jeg er involvert i (for å vise oversikt)
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0 text-left">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Velkommen, {currentUser.name.split(' ')[0]}!</h2>
        <p className="text-slate-500 mt-1 font-medium">Her er alt du er involvert i den nærmeste tiden.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Venstre Kolonne: Kalender & Involvering */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="text-indigo-600" size={22} /> Mine kommende arrangementer
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-full">{uniqueInvolvedEvents.length} Totalt</span>
          </div>
          
          <div className="space-y-4">
            {uniqueInvolvedEvents.length > 0 ? uniqueInvolvedEvents.map(occ => {
              const myRolesForThis = myAssignments.filter(a => a.occurrence.id === occ.id);
              const myProgramPosts = myProgramItems.filter(p => p.occurrence.id === occ.id);
              
              return (
                <button key={occ.id} onClick={() => setSelectedOccurrenceId(occ.id)} className="w-full text-left bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-700 font-bold border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <span className="text-[10px] uppercase leading-none mb-1">{new Intl.DateTimeFormat('no-NO', { month: 'short' }).format(new Date(occ.date))}</span>
                        <span className="text-2xl leading-none">{new Date(occ.date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-lg tracking-tight truncate">{occ.title_override || db.eventTemplates.find(t => t.id === occ.template_id)?.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                           {myRolesForThis.map(a => (
                             <span key={a.id} className="text-[9px] font-bold uppercase tracking-widest bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200">
                               <Shield size={10} /> {a.role?.name || 'Vakt'}
                             </span>
                           ))}
                           {myProgramPosts.map(p => (
                             <span key={p.id} className="text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                               <CheckCircle2 size={10} /> {p.title}
                             </span>
                           ))}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 hidden md:block" />
                  </div>
                </button>
              );
            }) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4 shadow-sm"><Calendar size={32} /></div>
                <p className="text-slate-400 font-bold">Ingen oppsatte vakter eller oppgaver.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">Når du blir tildelt et ansvar i kalenderen vil det dukke opp her med en gang.</p>
              </div>
            )}
          </div>
        </section>

        {/* Høyre Kolonne: Tasks & Groups */}
        <aside className="space-y-8 text-left">
          {/* Seksjon: Oppgaver og frister */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute -top-4 -right-4 p-8 opacity-5 scale-150 rotate-12"><Bell size={80} /></div>
            <h3 className="text-xl font-bold flex items-center gap-3 mb-6 text-indigo-300 relative">
              <Bell className="text-indigo-300" size={24} /> Viktige Frister
            </h3>
            <div className="space-y-4 relative">
              {myTasks.length > 0 ? myTasks.map(task => (
                <div key={task.id} className="bg-slate-800/40 p-5 rounded-2xl border-l-4 border-indigo-500 hover:bg-slate-800 transition-all shadow-lg group">
                  <p className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{task.title}</p>
                  {task.occurrence && (
                     <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-2">
                        <Calendar size={10}/> {task.occurrence.title_override || 'Gudstjeneste'}
                     </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Clock size={12} className="text-indigo-500" />
                    <span className="text-[11px] font-bold text-indigo-400">Frist: {new Intl.DateTimeFormat('no-NO', { day: 'numeric', month: 'short' }).format(new Date(task.deadline))}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-50">
                   <p className="text-xs text-indigo-400 font-bold">Ingen utestående oppgaver.</p>
                </div>
              )}
              <button onClick={onGoToWheel} className="w-full mt-4 flex items-center justify-between p-4 bg-indigo-600 rounded-2xl text-[11px] font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40">Gå til årshjulet <ArrowRight size={14} /></button>
            </div>
          </div>

          {/* Seksjon: Grupper */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Users className="text-teal-500" size={22} /> Mine Grupper & Teams
            </h3>
            <div className="space-y-3">
              {db.groupMembers.filter(gm => gm.person_id === currentUser.id).map(gm => {
                const group = db.groups.find(g => g.id === gm.group_id);
                if (!group) return null;
                return (
                  <button key={group.id} onClick={() => onViewGroup(group.id)} className="w-full text-left flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${group.category === GroupCategory.SERVICE ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : group.category === GroupCategory.FELLOWSHIP ? 'bg-teal-500' : 'bg-amber-500'}`}></div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{group.name}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Detalj-Modal for Arrangement */}
      {selectedOccurrenceId && selectedOcc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setSelectedOccurrenceId(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-12 bg-indigo-700 text-white flex justify-between items-start text-left relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-[-15deg]"><Calendar size={180} /></div>
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-300 mb-2">{new Intl.DateTimeFormat('no-NO', { dateStyle: 'full' }).format(new Date(selectedOcc.date))}</p>
                <h3 className="text-4xl font-bold tracking-tight">{selectedOcc.title_override || db.eventTemplates.find(t => t.id === selectedOcc.template_id)?.title}</h3>
              </div>
              <button onClick={() => setSelectedOccurrenceId(null)} className="p-3 bg-indigo-600 hover:bg-white hover:text-indigo-700 rounded-2xl transition-all relative z-10 shadow-xl"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 gap-12 bg-white scroll-smooth">
              <div className="space-y-10">
                {/* Min Involvering i dette arrangementet */}
                <section className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[2.5rem] relative shadow-sm">
                  <div className="absolute top-6 right-8 text-indigo-100"><Shield size={48}/></div>
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">Hva jeg skal gjøre</h4>
                  
                  <div className="space-y-6">
                    {/* Hovedroller */}
                    {myAssignments.filter(a => a.occurrence.id === selectedOccurrenceId).map(a => (
                      <div key={a.id}>
                        <p className="text-2xl font-bold text-indigo-900 leading-tight mb-3">{a.role?.name}</p>
                        <div className="space-y-3">
                          {a.role?.default_instructions.map((inst, i) => (
                            <div key={i} className="flex gap-4 text-left"><CheckCircle2 size={18} className="text-indigo-500 mt-1 shrink-0" /><p className="text-indigo-900/80 leading-relaxed font-semibold text-sm">{inst}</p></div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Programposter */}
                    {myProgramItems.filter(p => p.occurrence.id === selectedOccurrenceId).map(p => (
                      <div key={p.id} className="pt-4 border-t border-indigo-100">
                        <p className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-2"><CheckCircle2 size={18}/> Ansvarlig for: {p.title}</p>
                        <p className="text-xs text-emerald-600/70 font-bold uppercase tracking-widest">{p.duration_minutes} minutter i kjøreplanen</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Users size={16}/> Teamet for dagen</h4>
                   <div className="space-y-3">
                     {db.assignments.filter(a => a.occurrence_id === selectedOccurrenceId && a.person_id).map(a => {
                       const person = db.persons.find(p => p.id === a.person_id);
                       const role = db.serviceRoles.find(r => r.id === a.service_role_id);
                       if (!person) return null;
                       return (
                         <div key={a.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${a.person_id === currentUser.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${a.person_id === currentUser.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{person.name.charAt(0)}</div>
                            <div className="flex-1 min-w-0"><p className="font-bold text-sm text-slate-800 truncate">{person.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{role?.name}</p></div>
                            {a.person_id === currentUser.id && <span className="bg-indigo-200 text-indigo-700 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Meg</span>}
                         </div>
                       )
                     })}
                   </div>
                </section>
              </div>

              <div className="space-y-8">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={16}/> Kjøreplan / Program</h4>
                <div className="space-y-3">
                  {programWithTimes.map(item => {
                    const responsible = item.service_role_id ? db.serviceRoles.find(r => r.id === item.service_role_id)?.name : item.group_id ? db.groups.find(g => g.id === item.group_id)?.name : null;
                    const isMyItem = item.person_id === currentUser.id || (item.service_role_id && myAssignments.some(a => a.occurrence.id === selectedOccurrenceId && a.service_role_id === item.service_role_id));
                    return (
                      <div key={item.id} className={`flex items-start gap-5 p-5 rounded-[2rem] border transition-all ${isMyItem ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                        <div className="mt-1 flex flex-col items-center shrink-0 w-12 text-center">
                           <span className={`text-xs font-bold ${isMyItem ? 'text-white' : 'text-indigo-600'}`}>{item.formattedTime}</span>
                           <span className={`text-[10px] ${isMyItem ? 'text-indigo-200' : 'text-slate-400'} font-bold`}>{item.duration_minutes}m</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <h5 className={`font-bold text-sm leading-tight ${isMyItem ? 'text-white' : 'text-slate-800'}`}>{item.title}</h5>
                           {responsible && (<p className={`text-[9px] font-bold uppercase tracking-[0.1em] mt-2 flex items-center gap-1.5 ${isMyItem ? 'text-indigo-200' : 'text-slate-500'}`}><Shield size={10}/> {responsible}</p>)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-center shrink-0"><button onClick={() => setSelectedOccurrenceId(null)} className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all text-sm tracking-wide">Ferdiglest</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
