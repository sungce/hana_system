'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Download, Calendar, User, FileText, BarChart3, CheckCircle2, Settings2, Edit2, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuidanceLog {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  content: string;
  cumulativeCount: number;
  actionResult: string;
  homeroomTeacher: string;
  createdAt: number;
}

export default function StudentGuidanceApp() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logs, setLogs] = useState<GuidanceLog[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStudentName, setFilterStudentName] = useState('');
  const [filterHomeroomTeacher, setFilterHomeroomTeacher] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
  const [templateInput, setTemplateInput] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    date: '',
    studentId: '',
    studentName: '',
    content: '',
    actionResult: '',
    homeroomTeacher: '',
  });

  // Refresh time when form opens
  useEffect(() => {
    if (isFormOpen) {
      const now = new Date();
      // Adjust for local time zone
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
      queueMicrotask(() => {
        setFormData(prev => ({ ...prev, date: localISOTime }));
      });
    }
  }, [isFormOpen]);

  // Load data from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('student-guidance-logs');
    const savedTemplates = localStorage.getItem('student-guidance-templates');
    const savedDarkMode = localStorage.getItem('student-guidance-dark-mode');
    
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      queueMicrotask(() => setIsDarkMode(isDark));
    }

    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        // Migrate old logs to include homeroomTeacher field if missing
        const migrated = parsed.map((log: any) => ({
          ...log,
          homeroomTeacher: log.homeroomTeacher || ''
        }));
        queueMicrotask(() => setLogs(migrated));
      } catch (e) {
        console.error('Failed to parse logs', e);
      }
    }

    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        queueMicrotask(() => setTemplates(parsed));
      } catch (e) {
        console.error('Failed to parse templates', e);
      }
    } else {
      // Default templates
      const defaults = ['수업 중 잡담 및 태도 불량', '과제 미제출 및 학습 태도 소홀', '교우 관계 갈등 중재', '복장 및 용모 규정 위반', '무단 결과 및 지각'];
      queueMicrotask(() => setTemplates(defaults));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (logs.length > 0 || localStorage.getItem('student-guidance-logs')) {
      localStorage.setItem('student-guidance-logs', JSON.stringify(logs));
    }
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('student-guidance-templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('student-guidance-dark-mode', isDarkMode.toString());
  }, [isDarkMode]);

  // Calculate cumulative count for a student
  const getCumulativeCount = (studentId: string) => {
    return logs.filter(log => log.studentId === studentId).length + 1;
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLog: GuidanceLog = {
      id: crypto.randomUUID(),
      ...formData,
      cumulativeCount: getCumulativeCount(formData.studentId),
      createdAt: Date.now(),
    };

    setLogs([newLog, ...logs]);
    setIsFormOpen(false);
    setFormData({
      date: new Date().toISOString().slice(0, 16),
      studentId: '',
      studentName: '',
      content: '',
      actionResult: '',
      homeroomTeacher: '',
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setLogs(logs.filter(log => log.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const commonContents = useMemo(() => {
    const contentsFromLogs = logs.map(log => log.content);
    const combined = [...templates, ...contentsFromLogs];
    const uniqueContents = Array.from(new Set(combined));
    return uniqueContents;
  }, [logs, templates]);

  const handleAddTemplate = () => {
    if (!templateInput.trim()) return;
    if (editingTemplateIndex !== null) {
      const newTemplates = [...templates];
      newTemplates[editingTemplateIndex] = templateInput.trim();
      setTemplates(newTemplates);
      setEditingTemplateIndex(null);
    } else {
      setTemplates([templateInput.trim(), ...templates]);
    }
    setTemplateInput('');
  };

  const deleteTemplate = (index: number) => {
    setTemplates(templates.filter((_, i) => i !== index));
  };

  const startEditTemplate = (index: number) => {
    setEditingTemplateIndex(index);
    setTemplateInput(templates[index]);
  };

  const filteredSuggestions = useMemo(() => {
    if (!formData.content) return [];
    return commonContents.filter(c => 
      c.toLowerCase().includes(formData.content.toLowerCase()) && 
      c.toLowerCase() !== formData.content.toLowerCase()
    ).slice(0, 5);
  }, [commonContents, formData.content]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        (log.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.studentId || '').includes(searchTerm) ||
        (log.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.homeroomTeacher || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStudentName = !filterStudentName || (log.studentName || '').toLowerCase().includes(filterStudentName.toLowerCase());
      const matchesHomeroomTeacher = !filterHomeroomTeacher || (log.homeroomTeacher || '').toLowerCase().includes(filterHomeroomTeacher.toLowerCase());
      
      const logDate = new Date(log.date).getTime();
      const matchesStartDate = !filterStartDate || logDate >= new Date(filterStartDate).getTime();
      const matchesEndDate = !filterEndDate || logDate <= new Date(filterEndDate).getTime() + 86399999; // End of day

      return matchesSearch && matchesStudentName && matchesHomeroomTeacher && matchesStartDate && matchesEndDate;
    });
  }, [logs, searchTerm, filterStudentName, filterHomeroomTeacher, filterStartDate, filterEndDate]);

  const exportToCSV = () => {
    const headers = ['일시', '학번', '성명', '지도 내용', '누적 횟수', '조치 결과', '담임교사'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        `"${log.date || ''}"`,
        `"${log.studentId || ''}"`,
        `"${log.studentName || ''}"`,
        `"${(log.content || '').replace(/"/g, '""')}"`,
        log.cumulativeCount || 0,
        `"${(log.actionResult || '').replace(/"/g, '""')}"`,
        `"${(log.homeroomTeacher || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `생활지도일지_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A] text-[#F8FAFC]' : 'bg-[#FDFCFB] text-[#1C1C1C]'} p-4 md:p-12 font-sans selection:bg-[#E5E7EB]`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className={`flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b pb-8 transition-colors duration-500 ${isDarkMode ? 'border-[#1E293B]' : 'border-[#E5E7EB]'}`}>
          <div className="space-y-2">
            <div className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-2 transition-colors duration-500 ${isDarkMode ? 'bg-[#1E293B] text-[#94A3B8]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
              학생 관리 시스템
            </div>
            <h1 className={`text-5xl font-serif font-medium tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>
              생활지도 일지
            </h1>
            <p className={`text-sm max-w-md leading-relaxed transition-colors duration-500 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
              학생 개개인의 성장을 위한 세심한 기록과 체계적인 관리. 
              <span className={`block mt-1 font-medium transition-colors duration-500 ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#374151]'}`}>품격 있는 교육 환경을 위한 첫걸음입니다.</span>
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full border transition-all duration-300 shadow-sm ${
                isDarkMode 
                ? 'bg-[#1E293B] border-[#334155] text-yellow-400 hover:bg-[#334155]' 
                : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
              }`}
              title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => setIsTemplateManagerOpen(true)}
              className={`group flex items-center gap-2 px-5 py-2.5 border rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm ${
                isDarkMode 
                ? 'bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:bg-[#334155]' 
                : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]'
              }`}
            >
              <Settings2 size={14} className="group-hover:rotate-90 transition-transform" />
              템플릿 관리
            </button>
            <button 
              onClick={exportToCSV}
              className={`group flex items-center gap-2 px-5 py-2.5 border rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm ${
                isDarkMode 
                ? 'bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:bg-[#334155]' 
                : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]'
              }`}
            >
              <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              CSV 내보내기
            </button>
            <button 
              onClick={() => setIsFormOpen(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 ${
                isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-[#111827] text-white hover:bg-[#374151]'
              }`}
            >
              <Plus size={14} />
              새 일지 작성
            </button>
          </div>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: '총 지도 건수', value: `${logs.length}건`, icon: FileText },
            { label: '지도 학생 수', value: `${new Set(logs.map(l => l.studentId)).size}명`, icon: User },
            { label: '최다 누적 횟수', value: `${logs.length > 0 ? Math.max(...logs.map(l => l.cumulativeCount)) : 0}회`, icon: BarChart3 },
          ].map((stat, i) => (
            <div key={i} className={`group p-8 rounded-2xl border transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
              isDarkMode 
              ? 'bg-[#1E293B] border-[#334155] hover:border-[#475569]' 
              : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl transition-colors ${
                  isDarkMode ? 'bg-[#334155] group-hover:bg-[#475569]' : 'bg-[#F9FAFB] group-hover:bg-[#F3F4F6]'
                }`}>
                  <stat.icon size={20} className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#374151]'} />
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#475569]' : 'text-[#9CA3AF]'}`}>통계 데이터</div>
              </div>
              <div className={`text-3xl font-serif font-medium mb-1 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>{stat.value}</div>
              <div className={`text-xs font-medium uppercase tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="space-y-4 mb-10">
          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-[#475569] group-focus-within:text-white' : 'text-[#9CA3AF] group-focus-within:text-[#111827]'}`} size={18} />
              <input 
                type="text" 
                placeholder="학생 이름, 학번 또는 지도 내용 검색..." 
                className={`w-full pl-14 pr-6 py-4 border rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 shadow-sm text-sm ${
                  isDarkMode 
                  ? 'bg-[#1E293B] border-[#334155] text-white focus:ring-blue-500/10 focus:border-blue-500' 
                  : 'bg-white border-[#E5E7EB] text-[#111827] focus:ring-[#111827]/5 focus:border-[#111827]'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`px-6 py-4 rounded-2xl border transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${
                isFilterVisible 
                ? (isDarkMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#111827] text-white border-[#111827]')
                : (isDarkMode ? 'bg-[#1E293B] text-[#CBD5E1] border-[#334155] hover:border-[#475569]' : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#D1D5DB]')
              }`}
            >
              <Settings2 size={18} />
              필터 {isFilterVisible ? '닫기' : '열기'}
            </button>
          </div>

          <AnimatePresence>
            {isFilterVisible && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border rounded-2xl shadow-sm transition-colors duration-500 ${
                  isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E5E7EB]'
                }`}>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>시작일</label>
                    <input 
                      type="date" 
                      className={`w-full px-4 py-2 border rounded-xl text-xs outline-none transition-colors ${
                        isDarkMode ? 'bg-[#0F172A] border-[#334155] text-white focus:border-blue-500' : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:border-[#111827]'
                      }`}
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>종료일</label>
                    <input 
                      type="date" 
                      className={`w-full px-4 py-2 border rounded-xl text-xs outline-none transition-colors ${
                        isDarkMode ? 'bg-[#0F172A] border-[#334155] text-white focus:border-blue-500' : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:border-[#111827]'
                      }`}
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>성명 필터</label>
                    <input 
                      type="text" 
                      placeholder="이름 입력..."
                      className={`w-full px-4 py-2 border rounded-xl text-xs outline-none transition-colors ${
                        isDarkMode ? 'bg-[#0F172A] border-[#334155] text-white focus:border-blue-500' : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:border-[#111827]'
                      }`}
                      value={filterStudentName}
                      onChange={(e) => setFilterStudentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>담임교사 필터</label>
                    <input 
                      type="text" 
                      placeholder="담임교사 입력..."
                      className={`w-full px-4 py-2 border rounded-xl text-xs outline-none transition-colors ${
                        isDarkMode ? 'bg-[#0F172A] border-[#334155] text-white focus:border-blue-500' : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:border-[#111827]'
                      }`}
                      value={filterHomeroomTeacher}
                      onChange={(e) => setFilterHomeroomTeacher(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <button 
                      onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                        setFilterStudentName('');
                        setFilterHomeroomTeacher('');
                        setSearchTerm('');
                      }}
                      className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
                    >
                      필터 초기화
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logs Table - Responsive Card Layout for Mobile, Table for Desktop */}
        <div className={`border shadow-sm overflow-hidden mb-20 transition-colors duration-500 ${
          isDarkMode ? 'bg-[#1E293B] border-[#334155] rounded-3xl' : 'bg-white border-[#E5E7EB] rounded-3xl'
        }`}>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                  <th className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>일시</th>
                  <th className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>학번</th>
                  <th className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>성명</th>
                  <th className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>지도 내용</th>
                  <th className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] text-center ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>누적</th>
                  <th className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>조치 결과</th>
                  <th className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>담임교사</th>
                  <th className={`px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] text-right ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>관리</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors duration-500 ${isDarkMode ? 'divide-[#334155]' : 'divide-[#F3F4F6]'}`}>
                <AnimatePresence mode="popLayout">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <motion.tr 
                        key={log.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`transition-colors group ${isDarkMode ? 'hover:bg-[#0F172A]' : 'hover:bg-[#FDFCFB]'}`}
                      >
                        <td className={`px-8 py-6 text-xs font-mono ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                          {log.date.replace('T', ' ')}
                        </td>
                        <td className={`px-8 py-6 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>
                          {log.studentId}
                        </td>
                        <td className={`px-8 py-6 text-sm font-serif font-medium ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>
                          {log.studentName}
                        </td>
                        <td className={`px-8 py-6 text-sm italic max-w-xs truncate ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#4B5563]'}`}>
                          &quot;{log.content}&quot;
                        </td>
                        <td className="px-8 py-6 text-sm text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black ${
                            log.cumulativeCount >= 5 ? (isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-600 border border-red-100') : 
                            log.cumulativeCount >= 3 ? (isDarkMode ? 'bg-orange-900/30 text-orange-400 border border-orange-900/50' : 'bg-orange-50 text-orange-600 border border-orange-100') : 
                            (isDarkMode ? 'bg-[#0F172A] text-[#CBD5E1] border border-[#334155]' : 'bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB]')
                          }`}>
                            {log.cumulativeCount}
                          </span>
                        </td>
                        <td className={`px-8 py-6 text-sm ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#4B5563]'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs font-medium uppercase tracking-wider">{log.actionResult}</span>
                          </div>
                        </td>
                        <td className={`px-8 py-6 text-sm font-medium ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#4B5563]'}`}>
                          {log.homeroomTeacher}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => setDeleteConfirmId(log.id)}
                            className={`p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                              isDarkMode ? 'text-[#475569] hover:text-red-400 hover:bg-red-900/20' : 'text-[#D1D5DB] hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <div className={`flex flex-col items-center gap-3 transition-opacity duration-500 ${isDarkMode ? 'opacity-20' : 'opacity-30'}`}>
                          <FileText size={40} className={isDarkMode ? 'text-white' : 'text-[#111827]'} />
                          <p className={`text-sm font-medium uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>기록이 없습니다</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className={`md:hidden divide-y transition-colors duration-500 ${isDarkMode ? 'divide-[#334155]' : 'divide-[#F3F4F6]'}`}>
            <AnimatePresence mode="popLayout">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <motion.div 
                    key={log.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className={`text-xs font-bold uppercase tracking-widest font-mono ${isDarkMode ? 'text-[#475569]' : 'text-[#9CA3AF]'}`}>
                          {log.date.replace('T', ' ')}
                        </div>
                        <div className={`text-lg font-serif font-medium ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>
                          {log.studentName} <span className={`text-sm font-sans font-normal ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>({log.studentId})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${
                          log.cumulativeCount >= 5 ? (isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-600 border border-red-100') : 
                          log.cumulativeCount >= 3 ? (isDarkMode ? 'bg-orange-900/30 text-orange-400 border border-orange-900/50' : 'bg-orange-50 text-orange-600 border border-orange-100') : 
                          (isDarkMode ? 'bg-[#0F172A] text-[#CBD5E1] border border-[#334155]' : 'bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB]')
                        }`}>
                          {log.cumulativeCount}
                        </span>
                        <button 
                          onClick={() => setDeleteConfirmId(log.id)}
                          className={`p-2 rounded-full transition-all ${
                            isDarkMode ? 'text-[#475569] hover:text-red-400 hover:bg-red-900/20' : 'text-[#D1D5DB] hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className={`text-sm italic p-3 rounded-xl border transition-colors duration-500 ${
                      isDarkMode ? 'bg-[#0F172A] text-[#CBD5E1] border-[#334155]' : 'bg-[#F9FAFB] text-[#4B5563] border-[#F3F4F6]'
                    }`}>
                      &quot;{log.content}&quot;
                    </div>
                    <div className={`flex items-center justify-between gap-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">조치: {log.actionResult}</span>
                      </div>
                      <span className="text-xs font-medium italic">담임: {log.homeroomTeacher}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="px-8 py-20 text-center">
                  <div className={`flex flex-col items-center gap-3 transition-opacity duration-500 ${isDarkMode ? 'opacity-20' : 'opacity-30'}`}>
                    <FileText size={40} className={isDarkMode ? 'text-white' : 'text-[#111827]'} />
                    <p className={`text-sm font-medium uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>기록이 없습니다</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Template Manager Modal */}
      <AnimatePresence>
        {isTemplateManagerOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#111827]/30 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className={`w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border transition-colors duration-500 my-auto ${
                isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-white/20'
              }`}
            >
              <div className={`px-8 py-6 border-b flex items-center justify-between transition-colors duration-500 ${
                isDarkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#FDFCFB] border-[#F3F4F6]'
              }`}>
                <div className="space-y-1">
                  <h2 className={`text-xl font-serif font-medium ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>지도 내용 템플릿 관리</h2>
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#475569]' : 'text-[#9CA3AF]'}`}>자주 사용하는 문구 설정</p>
                </div>
                <button 
                  onClick={() => setIsTemplateManagerOpen(false)}
                  className={`p-2 rounded-full transition-all ${
                    isDarkMode ? 'text-[#475569] hover:text-white hover:bg-[#334155]' : 'text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="새로운 템플릿 내용을 입력하세요"
                    className={`flex-1 px-4 py-3 border rounded-xl outline-none transition-all text-sm ${
                      isDarkMode 
                      ? 'bg-[#0F172A] border-[#334155] text-white focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:ring-[#111827]/5 focus:border-[#111827]'
                    }`}
                    value={templateInput}
                    onChange={(e) => setTemplateInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
                  />
                  <button 
                    onClick={handleAddTemplate}
                    className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm ${
                      isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#111827] text-white hover:bg-[#374151]'
                    }`}
                  >
                    {editingTemplateIndex !== null ? '수정' : '추가'}
                  </button>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {templates.map((template, index) => (
                    <div key={index} className={`group flex items-center justify-between p-4 border rounded-xl transition-all ${
                      isDarkMode ? 'bg-[#0F172A] border-[#334155] hover:border-[#475569]' : 'bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}>
                      <span className={`text-sm italic ${isDarkMode ? 'text-[#CBD5E1]' : 'text-[#4B5563]'}`}>&quot;{template}&quot;</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditTemplate(index)}
                          className={`p-2 rounded-full transition-all ${
                            isDarkMode ? 'text-[#475569] hover:text-white hover:bg-[#334155]' : 'text-[#9CA3AF] hover:text-[#111827] hover:bg-white'
                          }`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => deleteTemplate(index)}
                          className={`p-2 rounded-full transition-all ${
                            isDarkMode ? 'text-[#475569] hover:text-red-400 hover:bg-[#334155]' : 'text-[#9CA3AF] hover:text-red-600 hover:bg-white'
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className={`text-center py-10 italic text-sm ${isDarkMode ? 'text-[#475569]' : 'text-[#9CA3AF]'}`}>
                      등록된 템플릿이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              <div className={`px-8 py-6 border-t transition-colors duration-500 ${
                isDarkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#FDFCFB] border-[#F3F4F6]'
              }`}>
                <button 
                  onClick={() => setIsTemplateManagerOpen(false)}
                  className={`w-full px-6 py-3 border rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                    isDarkMode ? 'border-[#334155] text-[#CBD5E1] hover:bg-[#1E293B]' : 'border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'
                  }`}
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center transition-colors duration-500 ${
                isDarkMode ? 'bg-[#1E293B]' : 'bg-white'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
              }`}>
                <Trash2 size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>기록 삭제</h3>
              <p className={`mb-6 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>정말로 이 생활지도 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className={`flex-1 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode ? 'border-[#334155] text-[#CBD5E1] hover:bg-[#0F172A]' : 'border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'
                  }`}
                >
                  취소
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  삭제하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/30 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className={`w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden border transition-colors duration-500 my-auto ${
                isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-white/20'
              }`}
            >
              <div className={`px-6 md:px-10 py-6 md:py-8 border-b flex items-center justify-between transition-colors duration-500 ${
                isDarkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#FDFCFB] border-[#F3F4F6]'
              }`}>
                <div className="space-y-1">
                  <h2 className={`text-xl md:text-2xl font-serif font-medium ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}>새 일지 작성</h2>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-[#475569]' : 'text-[#9CA3AF]'}`}>새로운 생활지도 기록</p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className={`p-2 md:p-3 rounded-full transition-all ${
                    isDarkMode ? 'text-[#475569] hover:text-white hover:bg-[#334155]' : 'text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleAddLog} className="px-6 md:px-10 py-6 md:py-10 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                      <Calendar size={12} /> 일시
                    </label>
                    <input 
                      type="datetime-local" 
                      required
                      className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm ${
                        isDarkMode 
                        ? 'bg-[#0F172A] border-[#334155] text-white focus:ring-blue-500/10 focus:border-blue-500' 
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:ring-[#111827]/5 focus:border-[#111827]'
                      }`}
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                      <User size={12} /> 학번
                    </label>
                    <input 
                      type="text" 
                      placeholder="예: 10101"
                      required
                      className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm ${
                        isDarkMode 
                        ? 'bg-[#0F172A] border-[#334155] text-white focus:ring-blue-500/10 focus:border-blue-500' 
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:ring-[#111827]/5 focus:border-[#111827]'
                      }`}
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                    <User size={12} /> 성명
                  </label>
                  <input 
                    type="text" 
                    placeholder="학생 이름을 입력하세요"
                    required
                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm ${
                      isDarkMode 
                      ? 'bg-[#0F172A] border-[#334155] text-white focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:ring-[#111827]/5 focus:border-[#111827]'
                    }`}
                    value={formData.studentName}
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                  />
                </div>

                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                      <FileText size={12} /> 지도 내용
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className={`text-[10px] font-bold uppercase tracking-wider hover:underline ${isDarkMode ? 'text-blue-400' : 'text-[#111827]'}`}
                    >
                      템플릿 보기
                    </button>
                  </div>
                  <textarea 
                    placeholder="지도한 구체적인 내용을 입력하세요..."
                    required
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-all resize-none text-sm italic ${
                      isDarkMode 
                      ? 'bg-[#0F172A] border-[#334155] text-white focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:ring-[#111827]/5 focus:border-[#111827]'
                    }`}
                    value={formData.content}
                    onChange={(e) => {
                      setFormData({...formData, content: e.target.value});
                      setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute z-10 w-full border rounded-2xl shadow-2xl mt-2 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar ${
                          isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E5E7EB]'
                        }`}
                      >
                        {(formData.content ? filteredSuggestions : templates).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`w-full text-left px-5 py-3 text-xs font-medium transition-all border-b last:border-0 italic ${
                              isDarkMode 
                              ? 'text-[#CBD5E1] hover:bg-[#334155] hover:text-white border-[#334155]' 
                              : 'text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827] border-[#F3F4F6]'
                            }`}
                            onClick={() => {
                              setFormData({...formData, content: suggestion});
                              setShowSuggestions(false);
                            }}
                          >
                            &quot;{suggestion}&quot;
                          </button>
                        ))}
                        {(formData.content ? filteredSuggestions : templates).length === 0 && (
                          <div className={`px-5 py-4 text-xs italic text-center ${isDarkMode ? 'text-[#475569]' : 'text-[#9CA3AF]'}`}>
                            {formData.content ? '일치하는 제안이 없습니다' : '등록된 템플릿이 없습니다'}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                    <CheckCircle2 size={12} /> 조치 결과
                  </label>
                  <input 
                    type="text" 
                    placeholder="예: 학부모 상담, 훈계, 성찰교실 등"
                    required
                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm ${
                      isDarkMode 
                      ? 'bg-[#0F172A] border-[#334155] text-white focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:ring-[#111827]/5 focus:border-[#111827]'
                    }`}
                    value={formData.actionResult}
                    onChange={(e) => setFormData({...formData, actionResult: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                    <User size={12} /> 담임교사
                  </label>
                  <input 
                    type="text" 
                    placeholder="담임교사 성명을 입력하세요"
                    required
                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm ${
                      isDarkMode 
                      ? 'bg-[#0F172A] border-[#334155] text-white focus:ring-blue-500/10 focus:border-blue-500' 
                      : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] focus:ring-[#111827]/5 focus:border-[#111827]'
                    }`}
                    value={formData.homeroomTeacher}
                    onChange={(e) => setFormData({...formData, homeroomTeacher: e.target.value})}
                  />
                </div>
              </form>

              <div className={`px-6 md:px-10 py-6 md:py-8 border-t flex gap-4 transition-colors duration-500 ${
                isDarkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#FDFCFB] border-[#F3F4F6]'
              }`}>
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className={`flex-1 px-6 py-3 border rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                    isDarkMode ? 'border-[#334155] text-[#CBD5E1] hover:bg-[#1E293B]' : 'border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'
                  }`}
                >
                  취소
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    const form = (e.target as HTMLButtonElement).closest('motion.div')?.querySelector('form');
                    if (form) form.requestSubmit();
                  }}
                  className={`flex-1 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg active:scale-95 ${
                    isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#111827] text-white hover:bg-[#374151]'
                  }`}
                >
                  저장하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
