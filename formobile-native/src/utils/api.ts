import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your machine's local IP so the phone can reach the backend over WiFi.
// This will be replaced dynamically or you can hardcode your IP.
export const API_URL = 'http://192.168.137.82:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export const getTodayDate = () => new Date().toISOString().split('T')[0];

export const calculateOverdueTasks = (tasks: any[]) => {
  const now = new Date();
  return tasks.filter((t) => {
    if (t.status === 'Done') return false;
    const [year, month, day] = t.deadline.split('-').map(Number);
    let hours = 12;
    let minutes = 0;
    if (t.due_time) {
      const [h, m] = t.due_time.split(':').map(Number);
      hours = h;
      minutes = m;
    }
    const deadlineDate = new Date(year, month - 1, day, hours, minutes);
    return deadlineDate < now;
  });
};

// AsyncStorage helpers
export const saveUser = async (user: any) => {
  await AsyncStorage.setItem('taskflow_user', JSON.stringify(user));
};

export const loadUser = async () => {
  const raw = await AsyncStorage.getItem('taskflow_user');
  return raw ? JSON.parse(raw) : null;
};

export const clearUser = async () => {
  await AsyncStorage.removeItem('taskflow_user');
  await AsyncStorage.removeItem('taskflow_view');
};
