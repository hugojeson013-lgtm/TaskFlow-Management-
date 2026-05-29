import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ScrollView, ActivityIndicator, Alert, Modal, TextInput, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, getTodayDate, calculateOverdueTasks } from '../utils/api';
import { Colors, commonStyles, shadow, shadowSm } from '../utils/theme';

// ─── Types ───
interface Task { id: number; title: string; category: number; priority: string; deadline: string; due_time?: string; status: string; user: number; }
interface Category { id: number; name: string; color: string; }

// ─── Color mappings for category badges ───
const catColorMap: Record<string, { bg: string; text: string; border: string }> = {
  'bg-blue-100 text-blue-700':    { bg: Colors.blue100,    text: Colors.blue700,    border: Colors.blue200 },
  'bg-emerald-100 text-emerald-700': { bg: Colors.emerald100, text: Colors.emerald700, border: Colors.emerald100 },
  'bg-rose-100 text-rose-700':    { bg: Colors.rose100,    text: Colors.rose700,    border: Colors.rose200 },
  'bg-purple-100 text-purple-700':{ bg: Colors.purple100,  text: Colors.purple700,  border: Colors.purple100 },
  'bg-amber-100 text-amber-700':  { bg: Colors.amber100,   text: Colors.amber700,   border: Colors.amber100 },
  'bg-pink-100 text-pink-700':    { bg: Colors.pink100,    text: Colors.pink700,    border: Colors.pink100 },
  'bg-indigo-100 text-indigo-700':{ bg: Colors.indigo100,  text: Colors.indigo700,  border: Colors.indigo100 },
};

const getCatColors = (colorClass: string) => catColorMap[colorClass] || { bg: Colors.slate100, text: Colors.slate700, border: Colors.slate200 };

// ─── Metric Card ───
function MetricCard({ title, value, iconName, color, bg }: { title: string; value: number; iconName: string; color: string; bg: string }) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[styles.metricIcon, { backgroundColor: bg }]}>
        <Feather name={iconName as any} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.metricLabel}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Filter Button ───
function FilterBtn({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterBtn, active && styles.filterBtnActive]}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Task Row ───
function TaskRow({ task, category, isOverdue, onStatusChange, onEdit, onDelete }: {
  task: Task; category?: Category; isOverdue: boolean;
  onStatusChange: (status: string) => void; onEdit: () => void; onDelete: () => void;
}) {
  const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    High:   { bg: Colors.rose50,    text: Colors.rose700,    border: Colors.rose200 },
    Medium: { bg: Colors.blue50,    text: Colors.blue700,    border: Colors.blue200 },
    Low:    { bg: Colors.emerald50, text: Colors.emerald700, border: Colors.emerald100 },
  };
  const pc = priorityColors[task.priority] || priorityColors.Medium;
  const isDone = task.status === 'Done';

  const statusIcon = task.status === 'Done' ? 'check-circle' : task.status === 'In Progress' ? 'clock' : 'circle';
  const statusColor = task.status === 'Done' ? Colors.emerald500 : task.status === 'In Progress' ? Colors.blue500 : Colors.slate300;

  const catColors = category ? getCatColors(category.color) : null;

  const formatTime = (time: string) => {
    try {
      const [h, m] = time.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch { return time.substring(0, 5); }
  };

  return (
    <View style={[styles.taskRow, isOverdue && styles.taskRowOverdue, isDone && { opacity: 0.55 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
        <TouchableOpacity onPress={() => onStatusChange(isDone ? 'To Do' : 'Done')} style={{ marginRight: 12, marginTop: 2 }}>
          <Feather name={statusIcon as any} size={22} color={statusColor} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, isDone && { textDecorationLine: 'line-through', color: Colors.slate500 }]}>{task.title}</Text>
          <View style={styles.taskMeta}>
            {category && (
              <View style={[styles.taskBadge, { backgroundColor: catColors!.bg, borderColor: catColors!.border }]}>
                <Text style={[styles.taskBadgeText, { color: catColors!.text }]}>{category.name}</Text>
              </View>
            )}
            <View style={[styles.taskBadge, { backgroundColor: pc.bg, borderColor: pc.border }]}>
              <Text style={[styles.taskBadgeText, { color: pc.text }]}>{task.priority}</Text>
            </View>
            <View style={styles.taskDateRow}>
              <Feather name="calendar" size={12} color={isOverdue ? Colors.rose600 : Colors.slate500} />
              <Text style={[styles.taskDateText, isOverdue && { color: Colors.rose600, fontWeight: '600' }]}>
                {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {task.due_time ? ` ${formatTime(task.due_time)}` : ''}
                {isOverdue ? ' (Overdue)' : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.taskActions}>
        <TouchableOpacity onPress={onEdit} style={styles.taskActionBtn}>
          <Feather name="edit-2" size={16} color={Colors.blue600} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.taskActionBtn}>
          <Feather name="trash-2" size={16} color={Colors.rose500} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Task Modal ───
function TaskModal({ visible, onClose, onSave, categories, task }: {
  visible: boolean; onClose: () => void; onSave: (data: any) => void; categories: Category[]; task?: Task | null;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<number | string>('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState(getTodayDate());
  const [dueTime, setDueTime] = useState('12:00');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle(task?.title || '');
      setCategory(task?.category || categories[0]?.id || '');
      setPriority(task?.priority || 'Medium');
      setDeadline(task?.deadline || getTodayDate());
      setDueTime(task?.due_time ? task.due_time.substring(0, 5) : '12:00');
      setError('');
    }
  }, [visible, task]);

  const handleSave = () => {
    if (!title.trim()) { setError('Task title is required.'); return; }
    onSave({ title, category, priority, deadline, due_time: dueTime + ':00' });
  };

  const priorities = ['Low', 'Medium', 'High'];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{task ? 'Edit Task' : 'Create New Task'}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={Colors.slate400} /></TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {error ? <View style={commonStyles.errorBox}><Text style={commonStyles.errorText}>{error}</Text></View> : null}

            <Text style={styles.fieldLabel}>Task Title</Text>
            <TextInput style={commonStyles.input} value={title} onChangeText={setTitle} placeholder="E.g., Update database schema" placeholderTextColor={Colors.slate400} />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {categories.map(c => {
                const cc = getCatColors(c.color);
                const sel = category == c.id;
                return (
                  <TouchableOpacity key={c.id} onPress={() => setCategory(c.id)}
                    style={[styles.catChip, { backgroundColor: sel ? cc.bg : Colors.white, borderColor: sel ? cc.border : Colors.slate200 }]}>
                    <Text style={[styles.catChipText, { color: sel ? cc.text : Colors.slate600 }]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {priorities.map(p => {
                const sel = priority === p;
                return (
                  <TouchableOpacity key={p} onPress={() => setPriority(p)}
                    style={[styles.catChip, { backgroundColor: sel ? Colors.blue600 : Colors.white, borderColor: sel ? Colors.blue600 : Colors.slate200 }]}>
                    <Text style={[styles.catChipText, { color: sel ? Colors.white : Colors.slate600 }]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Deadline (YYYY-MM-DD)</Text>
            <TextInput style={commonStyles.input} value={deadline} onChangeText={setDeadline} placeholder="2026-05-28" placeholderTextColor={Colors.slate400} />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Time (HH:MM)</Text>
            <TextInput style={commonStyles.input} value={dueTime} onChangeText={setDueTime} placeholder="12:00" placeholderTextColor={Colors.slate400} />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 }}>
              <TouchableOpacity style={[commonStyles.buttonSecondary, { flex: 1 }]} onPress={onClose}>
                <Text style={commonStyles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[commonStyles.buttonPrimary, { flex: 1 }]} onPress={handleSave}>
                <Text style={commonStyles.buttonPrimaryText}>{task ? 'Save Changes' : 'Create Task'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Category Modal ───
function CategoryModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('bg-blue-100 text-blue-700');
  const [error, setError] = useState('');

  const presets = [
    { name: 'Blue', cls: 'bg-blue-100 text-blue-700' },
    { name: 'Green', cls: 'bg-emerald-100 text-emerald-700' },
    { name: 'Red', cls: 'bg-rose-100 text-rose-700' },
    { name: 'Purple', cls: 'bg-purple-100 text-purple-700' },
    { name: 'Amber', cls: 'bg-amber-100 text-amber-700' },
    { name: 'Pink', cls: 'bg-pink-100 text-pink-700' },
    { name: 'Indigo', cls: 'bg-indigo-100 text-indigo-700' },
  ];

  useEffect(() => { if (visible) { setName(''); setColor('bg-blue-100 text-blue-700'); setError(''); } }, [visible]);

  const handleSave = () => {
    if (!name.trim()) { setError('Category name is required.'); return; }
    onSave({ name: name.trim(), color });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Category</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={Colors.slate400} /></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            {error ? <View style={commonStyles.errorBox}><Text style={commonStyles.errorText}>{error}</Text></View> : null}
            <Text style={styles.fieldLabel}>Category Name</Text>
            <TextInput style={commonStyles.input} value={name} onChangeText={setName} placeholder="E.g., Work, Personal" placeholderTextColor={Colors.slate400} />
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Theme Color</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {presets.map(p => {
                const cc = getCatColors(p.cls);
                const sel = color === p.cls;
                return (
                  <TouchableOpacity key={p.cls} onPress={() => setColor(p.cls)}
                    style={[styles.catChip, { backgroundColor: cc.bg, borderColor: sel ? Colors.blue500 : cc.border, borderWidth: sel ? 2 : 1 }]}>
                    <Text style={[styles.catChipText, { color: cc.text }]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity style={[commonStyles.buttonSecondary, { flex: 1 }]} onPress={onClose}>
                <Text style={commonStyles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[commonStyles.buttonPrimary, { flex: 1 }]} onPress={handleSave}>
                <Text style={commonStyles.buttonPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════
// ─── MAIN DASHBOARD SCREEN ───
// ═══════════════════════════════════════════
export default function DashboardScreen({ user }: { user: any }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const today = getTodayDate();

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [catRes, taskRes] = await Promise.all([
        api.get('/categories/'),
        api.get(`/tasks/?userId=${user?.id || ''}`),
      ]);
      let cats = catRes.data;
      if (cats.length === 0) {
        const def = await api.post('/categories/', { name: 'General', color: 'bg-blue-100 text-blue-700' });
        cats = [def.data];
      }
      setCategories(cats);
      setTasks(taskRes.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data. Make sure backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overdueTasks = useMemo(() => calculateOverdueTasks(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter === 'today') result = tasks.filter(t => t.deadline === today && t.status !== 'Done');
    else if (filter === 'upcoming') {
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const ts = tomorrow.toISOString().split('T')[0];
      result = tasks.filter(t => t.deadline === ts && t.status !== 'Done');
    } else if (filter === 'overdue') result = overdueTasks;

    if (selectedCategoryId) result = result.filter(t => t.category === selectedCategoryId);

    return result.sort((a, b) => {
      if (a.deadline === b.deadline) {
        const ps: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        return (ps[b.priority] || 0) - (ps[a.priority] || 0);
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [tasks, filter, overdueTasks, today, selectedCategoryId]);

  const addTask = async (data: any) => {
    try {
      const res = await api.post('/tasks/', { ...data, user: user.id });
      setTasks(prev => [...prev, res.data]);
      setTaskModalVisible(false);
    } catch { Alert.alert('Error', 'Failed to create task.'); }
  };

  const updateTask = async (taskId: number, data: any) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/`, { ...data, user: user.id });
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
      setEditingTask(null);
    } catch { Alert.alert('Error', 'Failed to update task.'); }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    const prev = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
    try { await api.patch(`/tasks/${taskId}/`, { status }); }
    catch { setTasks(prev); Alert.alert('Error', 'Failed to update status.'); }
  };

  const deleteTask = async (taskId: number) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/tasks/${taskId}/`); setTasks(prev => prev.filter(t => t.id !== taskId)); }
        catch { Alert.alert('Error', 'Failed to delete task.'); }
      }},
    ]);
  };

  const addCategory = async (data: any) => {
    try {
      const res = await api.post('/categories/', data);
      setCategories(prev => [...prev, res.data]);
      setCatModalVisible(false);
    } catch { Alert.alert('Error', 'Failed to create category.'); }
  };

  const deleteCategory = (catId: number) => {
    const catName = categories.find(c => c.id === catId)?.name || 'Category';
    Alert.alert('Delete Category', `Delete "${catName}" and all its tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/categories/${catId}/`);
          setCategories(prev => prev.filter(c => c.id !== catId));
          setTasks(prev => prev.filter(t => t.category !== catId));
          setSelectedCategoryId(null);
        } catch { Alert.alert('Error', 'Failed to delete category.'); }
      }},
    ]);
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Colors.blue600} /><Text style={{ color: Colors.slate500, marginTop: 12 }}>Loading dashboard...</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(false); }} tintColor={Colors.blue600} />}
      >
        {error ? <View style={commonStyles.errorBox}><Text style={commonStyles.errorText}>{error}</Text></View> : null}

        {/* Header */}
        <View style={commonStyles.rowBetween}>
          <View>
            <Text style={commonStyles.h1}>Dashboard</Text>
            <Text style={commonStyles.subtitle}>Manage your tasks efficiently.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setTaskModalVisible(true)}>
            <Feather name="plus" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard title="Total" value={tasks.length} iconName="layout" color={Colors.blue600} bg={Colors.blue50} />
          <MetricCard title="Done" value={tasks.filter(t => t.status === 'Done').length} iconName="check-circle" color={Colors.emerald600} bg={Colors.emerald50} />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard title="Due Today" value={tasks.filter(t => t.deadline === today && t.status !== 'Done').length} iconName="calendar" color={Colors.amber600} bg={Colors.amber50} />
          <MetricCard title="Overdue" value={overdueTasks.length} iconName="alert-circle" color={Colors.rose600} bg={Colors.rose50} />
        </View>

        {/* Category Filter */}
        <View style={[commonStyles.cardPadded, { marginTop: 16 }]}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.label}>Filter by Category</Text>
            <TouchableOpacity onPress={() => setCatModalVisible(true)} style={styles.addCatBtn}>
              <Feather name="plus" size={14} color={Colors.slate600} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.slate600, marginLeft: 4 }}>Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {categories.map(cat => {
              const sel = selectedCategoryId === cat.id;
              const cc = getCatColors(cat.color);
              return (
                <TouchableOpacity key={cat.id} onPress={() => setSelectedCategoryId(sel ? null : cat.id)}
                  style={[styles.catChip, { backgroundColor: sel ? cc.bg : Colors.white, borderColor: sel ? cc.border : Colors.slate200, marginRight: 8 }]}>
                  <Text style={[styles.catChipText, { color: sel ? cc.text : Colors.slate600 }]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
            {selectedCategoryId && (
              <>
                <TouchableOpacity onPress={() => setSelectedCategoryId(null)} style={[styles.catChip, { borderColor: Colors.slate200, marginRight: 8 }]}>
                  <Feather name="x" size={12} color={Colors.slate600} />
                  <Text style={[styles.catChipText, { color: Colors.slate600, marginLeft: 4 }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteCategory(selectedCategoryId)} style={[styles.catChip, { borderColor: Colors.rose200, backgroundColor: Colors.rose50 }]}>
                  <Feather name="trash-2" size={12} color={Colors.rose700} />
                  <Text style={[styles.catChipText, { color: Colors.rose700, marginLeft: 4 }]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* Task Filter Tabs */}
        <View style={[commonStyles.card, { marginTop: 16 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 12 }}>
            <FilterBtn active={filter === 'all'} label="All Tasks" onPress={() => setFilter('all')} />
            <FilterBtn active={filter === 'today'} label="Today" onPress={() => setFilter('today')} />
            <FilterBtn active={filter === 'upcoming'} label="Upcoming" onPress={() => setFilter('upcoming')} />
            <FilterBtn active={filter === 'overdue'} label="Overdue" onPress={() => setFilter('overdue')} />
          </ScrollView>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="check-circle" size={40} color={Colors.slate300} />
              <Text style={{ color: Colors.slate500, marginTop: 8 }}>No tasks found for this view.</Text>
            </View>
          ) : (
            filteredTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                category={categories.find(c => c.id === task.category)}
                isOverdue={overdueTasks.some(o => o.id === task.id)}
                onStatusChange={(s) => updateTaskStatus(task.id, s)}
                onEdit={() => { setEditingTask(task); setTaskModalVisible(true); }}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <TaskModal visible={taskModalVisible && !editingTask} onClose={() => setTaskModalVisible(false)} onSave={addTask} categories={categories} />
      <TaskModal visible={!!editingTask} onClose={() => setEditingTask(null)} onSave={(d) => updateTask(editingTask!.id, d)} categories={categories} task={editingTask} />
      <CategoryModal visible={catModalVisible} onClose={() => setCatModalVisible(false)} onSave={addCategory} />
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.blue600, alignItems: 'center', justifyContent: 'center', ...shadowSm },
  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metricCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.slate200, ...shadowSm },
  metricIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: 12, fontWeight: '500', color: Colors.slate500 },
  metricValue: { fontSize: 22, fontWeight: '800', color: Colors.slate900 },
  addCatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.slate50, borderWidth: 1, borderColor: Colors.slate200, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: Colors.slate200 },
  catChipText: { fontSize: 12, fontWeight: '600' },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginRight: 8, backgroundColor: Colors.transparent },
  filterBtnActive: { backgroundColor: Colors.slate900 },
  filterBtnText: { fontSize: 13, fontWeight: '500', color: Colors.slate600 },
  filterBtnTextActive: { color: Colors.white },
  taskRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate100, flexDirection: 'row', alignItems: 'flex-start' },
  taskRowOverdue: { backgroundColor: '#fff5f5' },
  taskTitle: { fontSize: 15, fontWeight: '600', color: Colors.slate900, marginBottom: 6 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  taskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  taskBadgeText: { fontSize: 11, fontWeight: '600' },
  taskDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskDateText: { fontSize: 11, color: Colors.slate500 },
  taskActions: { flexDirection: 'row', gap: 8, marginLeft: 8, marginTop: 2 },
  taskActionBtn: { padding: 6 },
  emptyState: { padding: 40, alignItems: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', ...shadow },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.slate100 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: Colors.slate800 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: Colors.slate700, marginBottom: 6 },
});
