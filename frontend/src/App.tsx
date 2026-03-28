import React, { useState, useEffect } from 'react';
import './App.css';
import {
    pathNodes as initialPathNodes,
    lbData,
    usersData as initialUsersData,
    badgesData,
    activityData,
    adminQueue as initialAdminQueue,
    adminValidated as initialAdminValidated,
    adminRejected as initialAdminRejected
} from './data/mockData';

// --- HELPERS ---
const avatarColor = (name: string) => {
    const colors = ['#FFD600', '#A5D6A7', '#90CAF9', '#FFCC80', '#CE93D8', '#F48FB1', '#80CBC4'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % colors.length;
    return colors[Math.abs(hash)];
};

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<{ name: string; rollNo: string; domain: string; role: 'student' | 'admin' } | null>(null);
    const [loginRole, setLoginRole] = useState<'student' | 'admin'>('student');

    const [currentScreen, setCurrentScreen] = useState('path');
    const [points, setPoints] = useState(470);
    const [streak] = useState(14);
    const [notif, setNotif] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
    const [modal, setModal] = useState<{ isOpen: boolean; type: string; data: any }>({ isOpen: false, type: '', data: null });

    // Data States
    const [pathNodes, setPathNodes] = useState(initialPathNodes);
    const [users, setUsers] = useState(initialUsersData);
    const [adminQueue, setAdminQueue] = useState(initialAdminQueue);
    const [adminValidated, setAdminValidated] = useState(initialAdminValidated);
    const [adminRejected, setAdminRejected] = useState(initialAdminRejected);
    const [approvedSet, setApprovedSet] = useState(new Set<string>());
    const [rejectedSet, setRejectedSet] = useState(new Set<string>());

    const showNotif = (msg: string) => {
        setNotif({ msg, show: true });
        setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 2800);
    };

    const closeModal = () => setModal({ ...modal, isOpen: false });

    // Login handler
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const rollNo = formData.get('rollNo') as string;
        const domain = formData.get('domain') as string;

        if (!name || !rollNo || (loginRole === 'student' && !domain)) {
            showNotif('⚠️ Please fill all fields');
            return;
        }

        setUser({ name, rollNo, domain, role: loginRole });
        setIsLoggedIn(true);
        showNotif(`👋 Welcome, ${name}!`);
        setCurrentScreen('path');
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUser(null);
        showNotif('👋 Safely logged out');
    };

    // Leaderboard Domain logic
    const [lbDomain, setLbDomain] = useState('Academic');

    // User Filter logic
    const [userSearch, setUserSearch] = useState('');
    const [userFilterDomain, setUserFilterDomain] = useState('All');

    const filteredUsers = users.filter(u =>
        (userFilterDomain === 'All' || u.domain === userFilterDomain) &&
        (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.badges.some(b => b.toLowerCase().includes(userSearch.toLowerCase())))
    );

    // Admin Queue Filter
    const [adminTab, setAdminTab] = useState('queue');
    const pendingQueue = adminQueue.filter(s => !approvedSet.has(s.id) && !rejectedSet.has(s.id));

    const approveSubmission = (id: string, pts: number) => {
        setApprovedSet(new Set(approvedSet.add(id)));
        setPoints(p => p + pts);
        showNotif(`✅ Approved! +${pts} pts awarded`);
    };

    const rejectSubmission = (id: string) => {
        setRejectedSet(new Set(rejectedSet.add(id)));
        showNotif('❌ Submission rejected');
    };

    const completeNode = (id: number) => {
        const node = pathNodes.find(n => n.id === id);
        if (node && node.state === 'active') {
            const updatedNodes = pathNodes.map(n => {
                if (n.id === id) return { ...n, state: 'done' as const };
                if (n.state === 'locked' && n.id === id + 1) return { ...n, state: 'active' as const };
                return n;
            });
            setPathNodes(updatedNodes);
            setPoints(p => p + parseInt(node.pts));
            closeModal();
            showNotif(`🎉 ${node.label} completed! ${node.pts}`);
        }
    };

    // --- LOGIN SCREEN RENDER ---
    if (!isLoggedIn) {
        return (
            <div className="app-shell" style={{ justifyContent: 'center' }}>
                <div className="login-screen">
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🏠</div>
                        <div className="login-title">ALIET Clubs</div>
                        <div className="login-subtitle">Powering Student Contributions</div>
                    </div>

                    <div className="login-card">
                        <div className="login-toggle">
                            <button
                                className={`toggle-btn ${loginRole === 'student' ? 'active' : ''}`}
                                onClick={() => setLoginRole('student')}
                            >Student</button>
                            <button
                                className={`toggle-btn ${loginRole === 'admin' ? 'active' : ''}`}
                                onClick={() => setLoginRole('admin')}
                            >Admin</button>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <label className="input-label">FULL NAME</label>
                                <input type="text" name="name" className="login-input" placeholder="e.g. John Doe" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">ROLL NO</label>
                                <input type="text" name="rollNo" className="login-input" placeholder="e.g. 21X41A05XX" required />
                            </div>

                            {loginRole === 'student' && (
                                <div className="input-group">
                                    <label className="input-label">PRIMARY DOMAIN</label>
                                    <select name="domain" className="login-select" required>
                                        <option value="">Select Domain</option>
                                        <option value="Academic">Academic</option>
                                        <option value="Tech">Tech</option>
                                        <option value="Media">Media</option>
                                        <option value="Events">Events</option>
                                    </select>
                                </div>
                            )}

                            <button type="submit" className="btn btn-yellow" style={{ width: '100%', marginTop: '12px', padding: '14px' }}>
                                Login to Dashboard
                            </button>
                        </form>
                    </div>
                </div>
                <div className={`notif ${notif.show ? 'show' : ''}`}>{notif.msg}</div>
            </div>
        );
    }

    // --- MAIN APP RENDER ---
    return (
        <div className="app-shell">
            {/* TOP BAR */}
            <div className="topbar">
                <div className="topbar-logo"><span className="house">🏠</span> ALIET Clubs</div>
                <div className="topbar-stats">
                    <div className="stat-pill"><span className="icon">🔥</span> {streak}</div>
                    <div className="stat-pill"><span className="icon">🪙</span> {points} pts</div>
                </div>
            </div>

            {/* PATH SCREEN */}
            <div className={`screen ${currentScreen === 'path' ? 'active' : ''} fade-in`}>
                <div className="quest-bar">
                    <div className="quest-title">⚡ DAILY QUEST: Ask 1 question in a seminar!</div>
                    <div className="quest-sub">Reward: +15 pts &nbsp;|&nbsp; Progress: 0/1</div>
                    <div className="quest-progress"><div className="quest-progress-fill" style={{ width: '0%', transition: 'width 1s ease' }}></div></div>
                </div>
                <div className="section-title">🗺️ Your Activity Path</div>
                <div className="path-nodes">
                    {pathNodes.map((node, i) => (
                        <div className="path-node-wrap" key={node.id}>
                            {i > 0 && (
                                <div className={`path-connector ${pathNodes[i - 1].state === 'done' ? 'done' : pathNodes[i - 1].state === 'active' ? 'active' : ''}`}></div>
                            )}
                            <div
                                className={`path-node ${node.state}`}
                                onClick={() => (node.state === 'active' || node.state === 'done') ? setModal({ isOpen: true, type: 'node', data: node }) : showNotif('🔒 Complete previous activities first!')}
                            >
                                <span className="node-icon">{node.icon}</span>
                                {node.state === 'done' && <div className="done-check">✓</div>}
                                {node.state === 'locked' && <div className="lock-icon">🔒</div>}
                            </div>
                            <div className="path-node-label">{node.label}</div>
                            <div className="path-node-sub">{node.sub}</div>
                            <div className="path-node-pts">{node.pts}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* LEADERBOARD SCREEN */}
            <div className={`screen ${currentScreen === 'leaderboard' ? 'active' : ''} fade-in`}>
                <div className="lb-header">
                    <div style={{ fontFamily: "'Fredoka One'", fontSize: '1.3rem' }}>🏆 Leaderboard</div>
                </div>
                <div className="lb-domain-select">
                    {['Academic', 'Tech', 'Media', 'Events'].map(d => (
                        <div key={d} className={`domain-chip ${lbDomain === d ? 'active' : ''}`} onClick={() => setLbDomain(d)}>{d}</div>
                    ))}
                </div>
                <div id="lb-list">
                    {lbData[lbDomain]?.map((item, i) => (
                        <div className={`lb-row ${item.you ? 'you' : ''}`} key={i}>
                            <div className={`rank-badge ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-n'}`}>{i + 1}</div>
                            <div style={{ position: 'relative' }}>
                                <div className="avatar sm" style={{ background: avatarColor(item.name) }}>{item.name[0]}</div>
                                {item.you && <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--yellow)', color: '#000', borderRadius: '3px', fontSize: '.5rem', fontWeight: 800, padding: '0 3px' }}>YOU</div>}
                            </div>
                            <div className="lb-name">{item.name} {item.you && <span style={{ fontSize: '.7rem', color: '#999' }}>(you)</span>}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="lb-pts">🪙 {item.pts}</div>
                                {item.promo && <div className="promo-tag">▲ Promo</div>}
                                {item.demo && <div className="demo-tag">▼ Demo</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* USERS SCREEN */}
            <div className={`screen ${currentScreen === 'users' ? 'active' : ''} fade-in`}>
                <div className="section-title">👥 Contributors Directory</div>
                <div className="search-bar">
                    <span>🔍</span>
                    <input type="text" placeholder="Search by Name, Domain, or Badge..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                </div>
                <div style={{ padding: '4px 16px 8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['All', 'Tech', 'Academic', 'Engagement'].map(d => (
                        <div key={d} className={`domain-chip ${userFilterDomain === d ? 'active' : ''}`} onClick={() => setUserFilterDomain(d)}>{d}</div>
                    ))}
                </div>
                <div id="users-list">
                    {filteredUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '.9rem' }}>No contributors found 😕</div>
                    ) : (
                        filteredUsers.map((u, i) => (
                            <div className="user-row" key={i} onClick={() => setModal({ isOpen: true, type: 'user', data: u })}>
                                <div className="avatar" style={{ background: avatarColor(u.name) }}>{u.initials}</div>
                                <div className="user-info">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div className="user-name">{u.name}</div>
                                        <div className="pts-chip">🪙 {u.pts}</div>
                                    </div>
                                    <div className="user-role">{u.role}</div>
                                    <div className="user-badges">{u.badges.map((b, bi) => <span className="badge-pill badge-green" key={bi}>{b}</span>)}</div>
                                    <div className={`avail-tag ${u.available ? 'avail-yes' : 'avail-no'}`}>
                                        {u.available ? '✅ Available for Peer Review' : '⛔ Not Available'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* PROFILE SCREEN */}
            <div className={`screen ${currentScreen === 'profile' ? 'active' : ''} fade-in`}>
                <div className="profile-hero">
                    <div className="avatar lg" style={{ margin: '0 auto', background: 'rgba(0,0,0,.15)', color: 'var(--dark)' }}>{user?.name[0] || 'U'}</div>
                    <div className="profile-name">{user?.name}</div>
                    <div className="profile-title">{user?.rollNo} • {user?.domain} {user?.role === 'admin' ? '(Admin)' : ''}</div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontFamily: "'Fredoka One'", fontSize: '1.3rem' }}>{points}</div><div style={{ fontSize: '.72rem', opacity: .7 }}>Points</div></div>
                        <div style={{ width: '1px', background: 'rgba(0,0,0,.15)' }}></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontFamily: "'Fredoka One'", fontSize: '1.3rem' }}>3</div><div style={{ fontSize: '.72rem', opacity: .7 }}>Badges</div></div>
                        <div style={{ width: '1px', background: 'rgba(0,0,0,.15)' }}></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontFamily: "'Fredoka One'", fontSize: '1.3rem' }}>{streak}</div><div style={{ fontSize: '.72rem', opacity: .7 }}>Streak</div></div>
                    </div>
                </div>
                <div className="progress-block">
                    <div className="progress-label"><span>Overall Progress → Level 2: Leader</span><span>{points}/1000 pts</span></div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${(points / 1000) * 100}%` }}></div></div>
                    <div className="progress-label"><span>Current Domain: {user?.domain}</span><span>250/500 pts</span></div>
                    <div className="progress-bar"><div className="progress-fill yellow" style={{ width: '50%' }}></div></div>
                </div>
                <div className="section-title">🎖️ Badges</div>
                <div className="badges-grid">
                    {badgesData.map((b, i) => (
                        <div className={`badge-item ${b.earned ? '' : 'locked-badge'}`} key={i} onClick={() => b.earned && showNotif('🎖️ ' + b.name + ' — Earned!')}>
                            <div className="badge-icon">{b.icon}</div>
                            <div className="badge-name">{b.name}</div>
                        </div>
                    ))}
                </div>
                <div className="section-title">📋 Recent Validations</div>
                <div id="activity-list">
                    {activityData.map((a, i) => (
                        <div className="activity-row" key={i}><div className="time">{a.time}</div><div className="act-text">✅ {a.text}</div><div className="act-pts">{a.pts}</div></div>
                    ))}
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className="btn btn-outline" style={{ width: '100%', borderColor: '#ff4444', color: '#ff4444' }} onClick={handleLogout}>🚪 Logout</button>
                </div>
            </div>

            {/* APPROVALS SCREEN */}
            <div className={`screen ${currentScreen === 'admin' ? 'active' : ''} fade-in`}>
                <div style={{ background: 'var(--dark)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: "'Fredoka One'", fontSize: '1.1rem', color: '#fff' }}>Approvals Mode</div>
                </div>
                <div className="admin-tabs">
                    <div className={`admin-tab ${adminTab === 'queue' ? 'active' : ''}`} onClick={() => setAdminTab('queue')}>Queue</div>
                    <div className={`admin-tab ${adminTab === 'validated' ? 'active' : ''}`} onClick={() => setAdminTab('validated')}>Validated</div>
                    <div className={`admin-tab ${adminTab === 'rejected' ? 'active' : ''}`} onClick={() => setAdminTab('rejected')}>Rejected</div>
                </div>

                {adminTab === 'queue' && (
                    <div id="admin-queue">
                        {pendingQueue.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>All caught up! 🎉</div>
                        ) : (
                            pendingQueue.map(s => (
                                <div className="submission-card" key={s.id}>
                                    <div className="sub-header">
                                        <div className="avatar sm" style={{ background: avatarColor(s.name) }}>{s.initials}</div>
                                        <div><div style={{ fontWeight: 800, fontSize: '.88rem' }}>{s.name}</div><div style={{ fontSize: '.72rem', color: '#999' }}>{s.time}</div></div>
                                        <div style={{ marginLeft: 'auto' }}><span className="pts-chip">+{s.pts} pts</span></div>
                                    </div>
                                    <div className="sub-body">
                                        <div className="sub-task">{s.task}</div>
                                        <div className="sub-desc">{s.desc}</div>
                                        {s.hasImg && <div className="sub-evidence"><div style={{ background: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', borderRadius: '8px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📸</div></div>}
                                    </div>
                                    <div className="sub-actions">
                                        <button className="btn btn-green" onClick={() => approveSubmission(s.id, s.pts)}>✓ Approve</button>
                                        <button className="btn btn-red" onClick={() => rejectSubmission(s.id)}>✗ Reject</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {adminTab === 'validated' && (
                    <div id="admin-validated">
                        {[...adminValidated, ...adminQueue.filter(s => approvedSet.has(s.id))].map((s, i) => (
                            <div className="submission-card" key={i}>
                                <div className="sub-header">
                                    <div className="avatar sm" style={{ background: avatarColor(s.name) }}>{s.initials}</div>
                                    <div><div style={{ fontWeight: 800, fontSize: '.88rem' }}>{s.name}</div><div style={{ fontSize: '.72rem', color: '#999' }}>{s.time}</div></div>
                                    <div style={{ marginLeft: 'auto' }}><span className="pts-chip">+{s.pts} pts</span></div>
                                </div>
                                <div className="sub-body"><div className="sub-task">{s.task}</div><div className="sub-desc">{s.desc}</div></div>
                                <div className="verified-badge">✅ Verified</div>
                            </div>
                        ))}
                    </div>
                )}

                {adminTab === 'rejected' && (
                    <div id="admin-rejected">
                        {[...adminRejected, ...adminQueue.filter(s => rejectedSet.has(s.id))].map((s, i) => (
                            <div className="submission-card" key={i}>
                                <div className="sub-header">
                                    <div className="avatar sm" style={{ background: avatarColor(s.name) }}>{s.initials}</div>
                                    <div><div style={{ fontWeight: 800, fontSize: '.88rem' }}>{s.name}</div><div style={{ fontSize: '.72rem', color: '#999' }}>{s.time}</div></div>
                                    <div style={{ marginLeft: 'auto' }}><span className="pts-chip">+{s.pts} pts</span></div>
                                </div>
                                <div className="sub-body"><div className="sub-task">{s.task}</div><div className="sub-desc">{(s as any).reason || s.desc}</div></div>
                                <div style={{ padding: '0 14px 14px' }}><span className="badge-pill badge-red">✗ Rejected</span></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* BOTTOM NAV */}
            <div className="bottom-nav">
                <button className={`nav-item ${currentScreen === 'path' ? 'active' : ''}`} onClick={() => setCurrentScreen('path')}>
                    <span className="nav-icon">🗺️</span>Path
                </button>
                <button className={`nav-item ${currentScreen === 'leaderboard' ? 'active' : ''}`} onClick={() => setCurrentScreen('leaderboard')}>
                    <span className="nav-icon">🏆</span>Leaderboard
                </button>
                <button className={`nav-item ${currentScreen === 'users' ? 'active' : ''}`} onClick={() => setCurrentScreen('users')}>
                    <span className="nav-icon">👥</span>Users
                </button>
                {user?.role === 'admin' && (
                    <button className={`nav-item ${currentScreen === 'admin' ? 'active' : ''}`} onClick={() => setCurrentScreen('admin')}>
                        <span className="nav-icon">🔑</span>Approvals
                    </button>
                )}
                <button className={`nav-item ${currentScreen === 'profile' ? 'active' : ''}`} onClick={() => setCurrentScreen('profile')}>
                    <span className="nav-icon">👤</span>Profile
                </button>
            </div>

            {/* MODAL */}
            <div className={`modal-overlay ${modal.isOpen ? 'open' : ''}`} onClick={closeModal}>
                <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-handle"></div>
                    {modal.type === 'node' && modal.data && (
                        <>
                            <div className="modal-title">{modal.data.icon} {modal.data.label}</div>
                            <p style={{ fontSize: '.85rem', color: '#666', marginBottom: '12px' }}>{modal.data.sub} · {modal.data.pts}</p>
                            {modal.data.state === 'done' ? (
                                <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '12px', textAlign: 'center', fontWeight: 800, color: '#2E7D32' }}>✅ Completed!</div>
                            ) : (
                                <>
                                    <p style={{ fontSize: '.88rem', marginBottom: '16px' }}>Complete this activity to earn <strong>{modal.data.pts}</strong>. Submit your proof below.</p>
                                    <button className="btn btn-yellow" style={{ width: '100%', marginBottom: '8px' }} onClick={() => completeNode(modal.data.id)}>📤 Submit Proof</button>
                                </>
                            )}
                            <button className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }} onClick={closeModal}>Close</button>
                        </>
                    )}
                    {modal.type === 'user' && modal.data && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                <div className="avatar lg" style={{ background: avatarColor(modal.data.name) }}>{modal.data.initials}</div>
                                <div>
                                    <div style={{ fontFamily: "'Fredoka One'", fontSize: '1.2rem' }}>{modal.data.name}</div>
                                    <div style={{ fontSize: '.82rem', color: '#666' }}>{modal.data.role}</div>
                                    <div className="pts-chip" style={{ display: 'inline-block', marginTop: '4px' }}>🪙 {modal.data.pts} pts</div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>{modal.data.badges.map((b: string, bi: number) => <span className="badge-pill badge-green" key={bi}>{b}</span>)}</div>
                            {modal.data.available ? (
                                <button className="btn btn-yellow" style={{ width: '100%', marginBottom: '8px' }} onClick={() => { closeModal(); showNotif('📨 Review request sent to ' + modal.data.name + '!'); }}>🤝 Request Peer Review</button>
                            ) : (
                                <div className="badge-pill badge-red" style={{ padding: '8px 14px' }}>⛔ Not available for review</div>
                            )}
                            <button className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }} onClick={closeModal}>Close</button>
                        </>
                    )}
                </div>
            </div>

            {/* NOTIFICATION */}
            <div className={`notif ${notif.show ? 'show' : ''}`}>{notif.msg}</div>
        </div>
    );
}

export default App;
