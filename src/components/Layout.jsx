import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';

const DRAWER_EXPANDED_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 64;

export default function Layout({ children, currentPage, onNavigate }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [collapsed, setCollapsed] = useState(false);

    const drawerWidth = isMobile ? 0 : (collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_EXPANDED_WIDTH);

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
            <Sidebar
                currentPage={currentPage}
                onNavigate={onNavigate}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    flexBasis: 0,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    maxWidth: '100%',
                    transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
                    p: { xs: 1.5, sm: 2, md: 3 },
                    overflow: 'auto',
                    minWidth: 0,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}