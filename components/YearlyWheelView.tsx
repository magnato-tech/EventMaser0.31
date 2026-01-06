
import React, { useState, useMemo } from 'react';
import { AppState, Task, Person, UUID } from '../types';
import { Calendar, Plus, Target, X, Trash2, Edit2, CheckCircle2, AlertTriangle, FileText, User, ArrowRight } from 'lucide-react';

interface Props {
  db: AppState;
  isAdmin: boolean;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const YearlyWheelView: React.FC<Props> = ({ db, isAdmin, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const globalTasks = useMemo(() => {
    return db.tasks
      .filter(t => t.is_global)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [db.tasks]);

  const tasksByMonth = useMemo(() => {
    const months: Record<number, Task[]> = {};
    for (let i = 0; i < 12; i++) months[i] = [];
    
    globalTasks.forEach(task => {
      const month = new Date(task.deadline).getMonth();
      months[month].push(task);
    });
    return months;
  }, [globalTasks]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const deadline = formData.get('deadline') as string;
    const responsible_id = formData.get('responsible_id') as string;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title,
        deadline,
        responsible_id,
      });
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        deadline,
        responsible_id,
        is_global: true,
        occurrence_id: null,
        template_id: null
      };
      onAddTask(newTask);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const monthNames = [
    'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentMonth = new Date().getMonth();

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 md:pb-0 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-indigo-500" size={24} /> Menighetens Årshjul
          </h2>
          <p className="text-sm text-slate-500">Oversikt over faste administrative frister og viktige datoer.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Plus size={18} /> Legg til frist
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthNames.map((name, index) => (
          <div key={index} className={`bg-white rounded-3xl border shadow-sm p-6 flex flex-col min-h-[200px] transition-all ${index === currentMonth ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-md' : 'border-slate-100'}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-50">
              <h3 className={`font-bold text-lg ${index === currentMonth ? 'text-indigo-600' : 'text-slate-800'}`}>{name}</h3>
              {index === currentMonth && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">Nå</span>}
            </div>

            <div className="space-y-3 flex-1">
              {tasksByMonth[index].length > 0 ? tasksByMonth[index].map(task => {
                const responsible = db.persons.find(p => p.id === task.responsible_id);
                const isOverdue = new Date(task.deadline) < new Date() && index === currentMonth;
                return (
                  <div key={task.id} className="group relative p-3 bg-slate-50 rounded-2xl hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 leading-tight mb-1">{task.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-bold flex items-center gap-1 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                            <Calendar size={10} /> {new Intl.DateTimeFormat('no-NO', { day: 'numeric' }).format(new Date(task.deadline))}.
                          </span>
                          {responsible && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 truncate max-w-[100px]">
                              <User size={10} /> {responsible.name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={12} /></button>
                          <button onClick={() => onDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                   <FileText size={24} className="mb-1 text-slate-400" />
                   <p className="text-[10px] text-slate-400">Ingen frister</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setEditingTask(null); }}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="p-6 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingTask ? 'Rediger Frist' : 'Ny Frist i Årshjulet'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingTask(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Oppgavetittel</label>
                <input 
                  required 
                  name="title" 
                  type="text" 
                  defaultValue={editingTask?.title || ''}
                  placeholder="f.eks. Frifond Søknad"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fristdato</label>
                <input 
                  required 
                  name="deadline" 
                  type="date" 
                  defaultValue={editingTask?.deadline || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ansvarlig person</label>
                <select 
                  name="responsible_id" 
                  defaultValue={editingTask?.responsible_id || ''}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">Velg ansvarlig...</option>
                  {db.persons.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.core_role})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg mt-4 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                {editingTask ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                {editingTask ? 'Oppdater Frist' : 'Legg til i Årshjul'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearlyWheelView;
