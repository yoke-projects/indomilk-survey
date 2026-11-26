// src/components/DateRangePicker.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Popover } from '@mui/material';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addDays, addMonths, subMonths, isSameMonth, isSameDay,
    isWithinInterval, startOfDay, endOfDay, subDays, isToday
} from 'date-fns';
import { id } from 'date-fns/locale';

const PRESETS = [
    { label: 'Hari Ini', key: 'today' },
    { label: 'Kemarin', key: 'yesterday' },
    { label: '7 Hari Terakhir', key: 'last7' },
    { label: '30 Hari Terakhir', key: 'last30' },
    { label: 'Bulan Ini', key: 'thisMonth' },
    { label: 'Bulan Lalu', key: 'lastMonth' },
];

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_ID = ['Mi','Se','Se','Ra','Ka','Ju','Sa'];

export default function DateRangePicker({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [leftMonth, setLeftMonth] = useState(new Date());
    const [rightMonth, setRightMonth] = useState(addMonths(new Date(), 1));
    const [tempStart, setTempStart] = useState(value?.start || null);
    const [tempEnd, setTempEnd] = useState(value?.end || null);
    const [selecting, setSelecting] = useState(false);

    useEffect(() => {
        setTempStart(value?.start || null);
        setTempEnd(value?.end || null);
    }, [open, value]);

    const handleClick = (event) => { setAnchorEl(event.currentTarget); setOpen(true); };
    const handleClose = () => { setOpen(false); setAnchorEl(null); };

    const handlePreset = (key) => {
        const now = new Date();
        let start, end;
        switch (key) {
            case 'today': start = startOfDay(now); end = endOfDay(now); break;
            case 'yesterday': start = startOfDay(subDays(now, 1)); end = endOfDay(subDays(now, 1)); break;
            case 'last7': start = startOfDay(subDays(now, 6)); end = endOfDay(now); break;
            case 'last30': start = startOfDay(subDays(now, 29)); end = endOfDay(now); break;
            case 'thisMonth': start = startOfMonth(now); end = endOfMonth(now); break;
            case 'lastMonth': start = startOfMonth(subMonths(now, 1)); end = endOfMonth(subMonths(now, 1)); break;
            default: return;
        }
        setTempStart(start);
        setTempEnd(end);
        setLeftMonth(startOfMonth(start));
        setRightMonth(addMonths(startOfMonth(start), 1));
    };

    const handleDateClick = (date) => {
        if (!selecting || tempStart === null || tempEnd !== null) {
            setTempStart(date); setTempEnd(null); setSelecting(true);
        } else {
            if (date < tempStart) { setTempEnd(tempStart); setTempStart(date); }
            else { setTempEnd(date); }
            setSelecting(false);
        }
    };

    const handleApply = () => {
        if (tempStart && tempEnd) onChange({ start: tempStart, end: tempEnd });
        handleClose();
    };

    const handleCancel = () => {
        setTempStart(value?.start || null); setTempEnd(value?.end || null); handleClose();
    };

    const handleClear = () => {
        onChange(null); setTempStart(null); setTempEnd(null); handleClose();
    };

    const handlePrevMonth = () => {
        setLeftMonth(subMonths(leftMonth, 1)); setRightMonth(subMonths(rightMonth, 1));
    };

    const handleNextMonth = () => {
        setLeftMonth(addMonths(leftMonth, 1)); setRightMonth(addMonths(rightMonth, 1));
    };

    const renderCalendar = (monthDate) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const days = [];
        let day = calStart;
        while (day <= calEnd) { days.push(day); day = addDays(day, 1); }

        const isInRange = (d) => tempStart && tempEnd && isWithinInterval(d, { start: tempStart, end: tempEnd });
        const isStart = (d) => tempStart && isSameDay(d, tempStart);
        const isEnd = (d) => tempEnd && isSameDay(d, tempEnd);

        return (
            <Box sx={{ flex: 1, minWidth: 260 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                        {MONTHS_ID[monthDate.getMonth()]} {monthDate.getFullYear()}
                    </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
                    {DAYS_ID.map((d, i) => (
                        <Box key={i} sx={{ textAlign: 'center', py: 0.5, fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8' }}>{d}</Box>
                    ))}
                    {days.map((d, i) => {
                        const inMonth = isSameMonth(d, monthDate);
                        const inRange = isInRange(d);
                        const start = isStart(d);
                        const end = isEnd(d);
                        const today = isToday(d);

                        return (
                            <Box
                                key={i}
                                onClick={() => inMonth && handleDateClick(d)}
                                sx={{
                                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.78rem', fontWeight: 500, cursor: inMonth ? 'pointer' : 'default',
                                    color: !inMonth ? '#CBD5E1' : (start || end ? 'white' : (inRange ? '#00796B' : '#0F172A')),
                                    bgcolor: start || end ? '#00796B' : (inRange ? 'rgba(0,121,107,0.12)' : 'transparent'),
                                    borderRadius: '8px',
                                    '&:hover': inMonth ? { bgcolor: start || end ? '#00695C' : 'rgba(0,121,107,0.15)' } : {},
                                    border: today && !start && !end ? '1px solid #00796B' : '1px solid transparent',
                                }}
                            >
                                {d.getDate()}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    const displayText = () => {
        if (!value?.start || !value?.end) return 'Pilih Rentang Tanggal';
        return `${format(value.start, 'd MMMM yyyy', { locale: id })} – ${format(value.end, 'd MMMM yyyy', { locale: id })}`;
    };

    return (
        <>
            <Button
                variant="outlined" size="small" startIcon={<Calendar size={16} />}
                onClick={handleClick}
                sx={{ minWidth: 260, justifyContent: 'flex-start', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 500, fontSize: '0.82rem', '&:hover': { borderColor: '#00796B', color: '#00796B' } }}
            >
                <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                    {displayText()}
                </Typography>
            </Button>

            <Popover
                open={open} anchorEl={anchorEl} onClose={handleCancel}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: { borderRadius: 3, boxShadow: '0 20px 60px rgba(15,23,42,0.15)', minWidth: 680, p: 2 }
                    }
                }}
            >
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ minWidth: 160, borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', mb: 1, textTransform: 'uppercase' }}>Quick Select</Typography>
                        {PRESETS.map((p) => (
                            <Button key={p.key} fullWidth onClick={() => handlePreset(p.key)}
                                sx={{ justifyContent: 'flex-start', mb: 0.5, py: 0.75, px: 1.5, borderRadius: 2, fontSize: '0.82rem', fontWeight: 500, color: '#475569', '&:hover': { bgcolor: '#F1F5F9', color: '#00796B' } }}>
                                {p.label}
                            </Button>
                        ))}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <IconButton onClick={handlePrevMonth} size="small"><ChevronLeft size={18} /></IconButton>
                            <IconButton onClick={handleNextMonth} size="small"><ChevronRight size={18} /></IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {renderCalendar(leftMonth)}
                            <Box sx={{ width: 1, bgcolor: 'divider' }} />
                            {renderCalendar(rightMonth)}
                        </Box>
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
                                {tempStart && tempEnd ? `${format(tempStart, 'dd/MM/yyyy')} – ${format(tempEnd, 'dd/MM/yyyy')}` : tempStart ? `${format(tempStart, 'dd/MM/yyyy')} – ...` : 'Pilih tanggal mulai'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" onClick={handleCancel} sx={{ color: '#64748B' }}>Batal</Button>
                                <Button size="small" onClick={handleClear} startIcon={<RotateCcw size={14} />} sx={{ color: '#DC2626' }}>Clear</Button>
                                <Button size="small" variant="contained" onClick={handleApply} disabled={!tempStart || !tempEnd}
                                    sx={{ bgcolor: '#00796B', '&:hover': { bgcolor: '#00695C' }, '&:disabled': { bgcolor: '#CBD5E1' } }}>Terapkan</Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </>
    );
}