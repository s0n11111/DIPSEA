import React, {useState} from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import IntroPage from './pages/IntroPage';

import {
    Box,
    CssBaseline,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import MicOutlinedIcon from '@mui/icons-material/MicOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const drawerWidth = 72;

function NavigationRail() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(true);

    const navItems = [
        {icon: <VideocamOutlinedIcon/>, label: '동영상', path: '/page1'},
        {icon: <ChatBubbleOutlineIcon/>, label: '시', path: '/page2'},
        {icon: <MicOutlinedIcon/>, label: '음성', path: '/page3'},
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: '#f9efff',
                    borderRight: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    overflowX: 'hidden',
                },
            }}
        >
            <Toolbar>
                <IconButton onClick={() => setOpen(!open)}>
                    <MenuIcon/>
                </IconButton>
            </Toolbar>

            <Collapse in={open}>
                <List>
                    {navItems.map((item) => {
                        const isSelected = location.pathname === item.path;
                        return (
                            <ListItem
                                key={item.path}
                                button
                                disableRipple
                                onClick={() => navigate(item.path)}
                                sx={{
                                    flexDirection: 'column',
                                    overflowX: 'hidden',
                                    backgroundColor: 'transparent',
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 0.5,
                                        backgroundColor: isSelected ? '#e3d8f5' : 'transparent',
                                        transition: 'background-color 0.3s',
                                        '&:hover': {
                                            backgroundColor: '#e3d8f5',
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            justifyContent: 'center',
                                            color: '#000',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                </Box>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: 12,
                                        textAlign: 'center',
                                        color: '#000',
                                        fontWeight: isSelected ? 'bold' : 'normal',
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Collapse>
        </Drawer>
    );
}

function MainLayout() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                width: '100%',
                overflowX: 'hidden',
                overflowY: 'hidden',
                background: 'var(--M3-ref-primary-primary99, #FFFBFE)',
            }}
        >
            <CssBaseline/>
            <NavigationRail/>

            <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden'}}>
                <AppBar
                    position="static"
                    sx={{backgroundColor: '#f9efff', boxShadow: 'none', borderBottom: 'none'}}
                >
                    <Toolbar sx={{justifyContent: 'center'}}>
                        <Typography
                            variant="h6"
                            component="div"
                            onClick={() => navigate('/')} // 클릭 시 인트로로 이동
                            sx={{
                                cursor: 'pointer',
                                color: '#000',
                                textAlign: 'center',
                                fontFamily: 'Amethysta',
                                fontSize: '24px',
                                fontStyle: 'normal',
                                fontWeight: 400,
                                lineHeight: '36px',
                            }}
                        >
                            DIPSEA
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Box sx={{p: 3, flexGrow: 1, overflowY: 'auto', overflowX: 'hidden'}}>
                    <Routes>
                        <Route path="/page1" element={<Page1/>}/>
                        <Route path="/page2" element={<Page2/>}/>
                        <Route path="/page3" element={<Page3/>}/>
                    </Routes>
                </Box>
            </Box>
        </Box>
    );
}

function AppWrapper() {
    const location = useLocation();
    const isIntro = location.pathname === '/';

    return isIntro ? (
        <Routes>
            <Route path="/" element={<IntroPage/>}/>
        </Routes>
    ) : (
        <MainLayout/>
    );
}

function App() {
    return (
        <Router>
            <AppWrapper/>
        </Router>
    );
}

export default App;