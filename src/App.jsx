import React, { useState } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import PersonnelManagement from './pages/PersonnelManagement';
import SurveyManagement from './pages/SurveyManagement';
import POManagement from './pages/POManagement';
import Settings from './pages/Settings';
import TertarikPO from './pages/TertarikPO';
import Dashboard from './pages/Dashboard';

const appTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb', contrastText: '#ffffff' },
        secondary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
        success: { main: '#10b981', light: '#34d399', dark: '#059669' },
        warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
        error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
        info: { main: '#0ea5e9', light: '#38bdf8', dark: '#0284c7' },
        background: { default: '#f5f7fa', paper: '#ffffff' },
        text: { primary: '#1f2937', secondary: '#6b7280' },
        divider: '#e5e7eb',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 14,
        h4: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', color: '#111827' },
        h5: { fontWeight: 700, fontSize: '1.25rem' },
        h6: { fontWeight: 600, fontSize: '1rem' },
        subtitle1: { fontSize: '0.9rem', fontWeight: 600 },
        subtitle2: { fontSize: '0.8rem', fontWeight: 600 },
        body1: { fontSize: '0.875rem' },
        body2: { fontSize: '0.8rem' },
        button: { fontSize: '0.85rem', fontWeight: 500 },
        caption: { fontSize: '0.72rem' },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 500,
                    boxShadow: 'none',
                    padding: '8px 16px',
                    '&:hover': { boxShadow: 'none' },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    border: '1px solid #e5e7eb',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    fontFamily: '"Inter", sans-serif',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '12px 16px',
                },
                head: {
                    backgroundColor: '#f9fafb',
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                },
            },
        },
        MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 500 } } },
        MuiTooltip: {
            styleOverrides: {
                tooltip: { backgroundColor: '#1f2937', fontSize: '0.72rem', borderRadius: 6 },
                arrow: { color: '#1f2937' },
            },
        },
        MuiPaginationItem: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
        MuiSelect: { styleOverrides: { root: { borderRadius: 999 } } },
    },
});

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');

    const renderPage = () => {
        switch (currentPage) {
            case 'personil':
                return <PersonnelManagement />;
            case 'survei':
                return <SurveyManagement />;
            case 'po':
                return <POManagement />;
            case 'settings':
                return <Settings />;
            case 'tertarik':
                return <TertarikPO />;
            case 'dashboard':
                return <Dashboard />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <ThemeProvider theme={appTheme}>
            <CssBaseline />
            <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
                {renderPage()}
            </Layout>
        </ThemeProvider>
    );
}

export default App;