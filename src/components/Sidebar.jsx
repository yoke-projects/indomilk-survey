import React, { useState } from 'react';
import {
    Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Box, Typography, IconButton, useMediaQuery, useTheme, Tooltip,
    Collapse, Divider
} from '@mui/material';
import {
    Users, BarChart3, ShoppingCart, Menu, ChevronLeft, ChevronRight, ChevronDown,
    Settings as SettingsIcon, Heart,LayoutDashboard
} from 'lucide-react';

const DRAWER_EXPANDED_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 64;

const menuSections = [
    {
        title: 'OPERASIONAL',
        items: [
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },    
            { key: 'survei', label: 'Manage Survei', icon: BarChart3 },
            { key: 'po', label: 'PO Management', icon: ShoppingCart },
            { key: 'tertarik', label: 'Tertarik & PO', icon: Heart },

        ],
    },
    {
        title: 'MASTER DATA',
        items: [
            { key: 'personil', label: 'Manage Personil', icon: Users },
        ],
    },
    {
        title: 'SISTEM',
        items: [
            { key: 'settings', label: 'Settings', icon: SettingsIcon },
        ],
    },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openSections, setOpenSections] = useState({ 'OPERASIONAL': true, 'MASTER DATA': true });

    const handleToggleMobile = () => setMobileOpen(!mobileOpen);
    const currentWidth = collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_EXPANDED_WIDTH;

    const toggleSection = (title) => {
        setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            {/* Logo */}
            <Box sx={{
                px: collapsed ? 1.5 : 2,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                gap: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                minHeight: 64,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Box sx={{
                        width: 36, height: 36, flexShrink: 0, borderRadius: 2,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '0.75rem',
                        boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                    }}>
                        IM
                    </Box>
                    {!collapsed && (
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                Indomilk
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 500 }}>
                                Survey Management
                            </Typography>
                        </Box>
                    )}
                </Box>

                {!isMobile && !collapsed && (
                    <IconButton onClick={onToggleCollapse} size="small" sx={{ width: 28, height: 28, color: '#9ca3af', '&:hover': { color: '#374151', bgcolor: '#f3f4f6' } }}>
                        <ChevronLeft size={16} />
                    </IconButton>
                )}
            </Box>

            {/* Search Placeholder */}
            {!collapsed && (
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.75,
                        bgcolor: '#f9fafb', borderRadius: 999,
                        border: '1px solid #e5e7eb',
                    }}>
                        <Box component="svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </Box>
                        <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>Cari menu...</Typography>
                    </Box>
                </Box>
            )}

            {/* Menu Items */}
            <Box sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
                {menuSections.map((section) => (
                    <Box key={section.title} sx={{ mb: 0.5 }}>
                        {!collapsed && (
                            <Box
                                onClick={() => toggleSection(section.title)}
                                sx={{
                                    px: 2, py: 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: '#f9fafb' },
                                }}
                            >
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>
                                    {section.title}
                                </Typography>
                                <ChevronDown size={14} color="#9ca3af" style={{ transform: openSections[section.title] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </Box>
                        )}
                        <Collapse in={collapsed || openSections[section.title]}>
                            <List sx={{ px: 0, py: 0 }}>
                                {section.items.map((item) => {
                                    const isActive = currentPage === item.key;
                                    const IconComponent = item.icon;
                                    const button = (
                                        <ListItemButton
                                            key={item.key}
                                            onClick={() => { onNavigate(item.key); if (isMobile) setMobileOpen(false); }}
                                            sx={{
                                                borderRadius: 0,
                                                minHeight: 40,
                                                justifyContent: collapsed ? 'center' : 'flex-start',
                                                px: collapsed ? 0 : 2,
                                                py: 0.75,
                                                color: isActive ? '#3b82f6' : '#4b5563',
                                                bgcolor: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                                                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                                                '&:hover': {
                                                    bgcolor: isActive ? 'rgba(59,130,246,0.12)' : '#f9fafb',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 32, color: 'inherit', justifyContent: 'center' }}>
                                                <IconComponent size={18} strokeWidth={isActive ? 2.2 : 2} />
                                            </ListItemIcon>
                                            {!collapsed && (
                                                <ListItemText
                                                    primary={
                                                        <Typography sx={{ fontWeight: isActive ? 600 : 500, fontSize: '0.82rem', color: 'inherit' }}>
                                                            {item.label}
                                                        </Typography>
                                                    }
                                                />
                                            )}
                                            {!collapsed && (
                                                <ChevronRight size={14} color="#9ca3af" />
                                            )}
                                        </ListItemButton>
                                    );

                                    return collapsed ? (
                                        <Tooltip key={item.key} title={item.label} placement="right" arrow>
                                            {button}
                                        </Tooltip>
                                    ) : button;
                                })}
                            </List>
                        </Collapse>
                    </Box>
                ))}
            </Box>

            {/* User Profile Footer */}
            {!collapsed && (
                <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 2, bgcolor: '#f9fafb' }}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: '0.8rem',
                        }}>
                            A
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#111827', lineHeight: 1.2 }}>Administrator</Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#6b7280' }}>admin@indomilk.id</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            {isMobile && (
                <IconButton onClick={handleToggleMobile} sx={{ position: 'fixed', top: 12, left: 12, zIndex: 1300, bgcolor: 'white', color: '#374151', border: '1px solid #e5e7eb', width: 40, height: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <Menu size={20} />
                </IconButton>
            )}

            {/* Desktop Drawer */}
            {!isMobile && (
                <Drawer variant="permanent" sx={{
                    width: currentWidth, flexShrink: 0,
                    transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
                    '& .MuiDrawer-paper': {
                        width: currentWidth, boxSizing: 'border-box',
                        borderRight: '1px solid #e5e7eb',
                        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
                        overflowX: 'hidden', bgcolor: 'background.paper',
                    },
                }}>
                    {drawerContent}
                </Drawer>
            )}

            {/* Mobile Drawer */}
            {isMobile && (
                <Drawer variant="temporary" open={mobileOpen} onClose={handleToggleMobile} ModalProps={{ keepMounted: true }}
                    sx={{ '& .MuiDrawer-paper': { width: DRAWER_EXPANDED_WIDTH, boxSizing: 'border-box', bgcolor: 'background.paper' } }}>
                    {drawerContent}
                </Drawer>
            )}
        </>
    );
}