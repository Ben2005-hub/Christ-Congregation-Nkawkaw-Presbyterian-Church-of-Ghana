



import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Member from './Member';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge, Navbar, Nav, Modal } from 'react-bootstrap';

const pcgLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Presbyterian_Church_of_Ghana_Crest.png/330px-Presbyterian_Church_of_Ghana_Crest.png';

// dynamic API base with optional local override (helps phones / LAN testing)
function getApiBase() {
  try {
    const override = localStorage.getItem('api_base_override');
    if (override && override.trim()) return override.trim();
    const loc = window.location;
    return `${loc.protocol}//${loc.hostname}:5001`;
  } catch (e) {
    return 'http://localhost:5001';
  }
}



function AdminPortal({ onLogout, authToken }) {
  // token is available via closure from App component state (see below)
  const [member, setMember] = useState({ name: '', phone: '', type: 'new', dob: '' });
  const [registerMsg, setRegisterMsg] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [sendResults, setSendResults] = useState([]);
  const [payment, setPayment] = useState({ memberId: '', amount: '', type: 'tithe' });
  const [paymentMsg, setPaymentMsg] = useState('');
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeMember, setActiveMember] = useState(null);
  const [birthdayTemplate, setBirthdayTemplate] = useState('');
  const [templateMsg, setTemplateMsg] = useState('');

  // Register member handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg('');
    try {
  const res = await fetch(`${getApiBase()}/api/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      const data = await res.json();
      if (res.ok) {
        setRegisterMsg('Registration successful!');
        setMember({ name: '', phone: '', type: 'new', dob: '' });
        fetchMembers();
      } else {
        setRegisterMsg(data.error || 'Registration failed');
      }
    } catch {
      setRegisterMsg('Server error');
    }
  };

  // Fetch members
  const fetchMembers = async () => {
  const res = await fetch(`${getApiBase()}/api/members`, { headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {} });
    const data = await res.json();
    setMembers(data);
  };

  // Fetch payments
  const fetchPayments = async () => {
  const res = await fetch(`${getApiBase()}/api/payments`, { headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {} });
    const data = await res.json();
    setPayments(data);
  };

  // Payment handler
  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentMsg('');
    try {
  const res = await fetch(`${getApiBase()}/api/payments`, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        body: JSON.stringify({
          ...payment,
          memberId: Number(payment.memberId)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentMsg('Payment successful!');
        setPayment({ memberId: '', amount: '', type: 'tithe' });
        fetchPayments();
      } else {
        setPaymentMsg(data.error || 'Payment failed');
      }
    } catch {
      setPaymentMsg('Server error');
    }
  };

  useEffect(() => {
    // only fetch protected data once a token is available
    if (!authToken) return;
    fetchMembers();
    fetchPayments();
    // load birthday template
    (async () => {
      try {
  const res = await fetch(`${getApiBase()}/api/sms/birthday-template`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (res.ok) {
          const data = await res.json();
          setBirthdayTemplate(data.template || '');
        }
      } catch (e) { }
    })();
  }, [authToken]);

  // Admin live search (debounced)
  useEffect(() => {
    if (!searchQ || searchQ.trim().length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
  const res = await fetch(`${getApiBase()}/api/members/search?q=${encodeURIComponent(searchQ)}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        const data = await res.json();
        setSearchResults(data || []);
      } catch (e) { setSearchResults([]); }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  // Dashboard summary
  const totalTithes = payments.filter(p => p.type === 'tithe').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalFuneral = payments.filter(p => p.type === 'funeral').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <Container className="py-4">
      <Navbar bg="light" expand="lg" className="mb-4 rounded shadow-sm">
        <Container>
          <Navbar.Brand href="#" className="d-flex align-items-center">
            <img src={pcgLogo} alt="Christ Congregation Nkakaw" className="logo styled-logo me-2" style={{maxWidth:50, height:'auto'}} />
            <div className="d-flex flex-column">
              <span className="fw-bold">Christ Congregation Nkakaw</span>
              <small className="text-muted">Christ Congregation Nkawkaw — Presbyterian Church of Ghana</small>
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar" className="justify-content-end">
            <Button variant="outline-danger" onClick={onLogout}>Logout</Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Row className="mb-4">
        <Col md={4}>
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <Card.Title>Dashboard</Card.Title>
              <Card.Text>Total Members: <Badge bg="success">{members.length}</Badge></Card.Text>
              <Card.Text>Total Tithes: <Badge bg="primary">GHS {totalTithes}</Badge></Card.Text>
              <Card.Text>Total Funeral Dues: <Badge bg="secondary">GHS {totalFuneral}</Badge></Card.Text>
            </Card.Body>
          </Card>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Register Member</Card.Title>
              <Form onSubmit={handleRegister}>
                <Form.Group className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Full Name"
                    value={member.name}
                    onChange={e => setMember({ ...member, name: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control
                    type="tel"
                    placeholder="Phone Number"
                    value={member.phone}
                    onChange={e => setMember({ ...member, phone: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Control
                    type="date"
                    placeholder="Date of Birth"
                    value={member.dob}
                    onChange={e => setMember({ ...member, dob: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Select
                    value={member.type}
                    onChange={e => setMember({ ...member, type: e.target.value })}
                    required
                  >
                    <option value="new">New Member</option>
                    <option value="old">Old Member</option>
                  </Form.Select>
                </Form.Group>
                <Button type="submit" variant="success" className="w-100">Register</Button>
              </Form>
              {registerMsg && <p className="mt-2 text-success">{registerMsg}</p>}
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <Card.Title>Make Payment</Card.Title>
              <div className="mb-3">
                <Form.Label>Search members (name or phone)</Form.Label>
                <Form.Control placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                {searchLoading && <div className="mt-2">Searching...</div>}
                {searchResults.length > 0 && (
                  <ListGroup className="mt-2">
                    {searchResults.map(s => (
                      <ListGroup.Item key={s.id} className="d-flex justify-content-between align-items-start">
                        <div>
                          <div><strong>{s.name}</strong></div>
                          <small className="text-muted">{s.phone}</small>
                        </div>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-primary" onClick={async () => {
                            // load payments for this member
                            try {
                              const r = await fetch(`${getApiBase()}/api/payments/member/${s.id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                              const list = await r.json();
                              // show payments in the payments pane
                              setPayments(list);
                            } catch (e) { }
                          }}>View Payments</Button>
                          <Button size="sm" variant="danger" onClick={async () => {
                            if (!confirm('Delete member? This cannot be undone.')) return;
                            try {
                              const r = await fetch(`${getApiBase()}/api/members/${s.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
                              const d = await r.json();
                              if (r.ok) { alert('Deleted'); fetchMembers(); setSearchResults(prev => prev.filter(x => x.id !== s.id)); }
                              else alert(d.error || 'Delete failed');
                            } catch (e) { alert('Server error'); }
                          }}>Delete</Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
              <Form onSubmit={handlePayment}>
                <Row>
                  <Col md={5} className="mb-2">
                    <Form.Select
                      value={payment.memberId}
                      onChange={e => setPayment({ ...payment, memberId: e.target.value })}
                      required
                    >
                      <option value="">Select Member</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.phone}) - {m.type === 'old' ? 'Old Member' : 'New Member'}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Form.Control
                      type="number"
                      placeholder="Amount (GHS)"
                      value={payment.amount}
                      onChange={e => setPayment({ ...payment, amount: e.target.value })}
                      required
                    />
                  </Col>
                  <Col md={4} className="mb-2">
                    <Form.Select
                      value={payment.type}
                      onChange={e => setPayment({ ...payment, type: e.target.value })}
                    >
                      <option value="tithe">Tithe</option>
                      <option value="funeral">Funeral Due</option>
                    </Form.Select>
                  </Col>
                </Row>
                <Button type="submit" variant="primary" className="w-100 mt-2">Pay</Button>
              </Form>
              {paymentMsg && <p className="mt-2 text-primary">{paymentMsg}</p>}
            </Card.Body>
          </Card>
          <Row>
            <Col md={6}>
              <Card className="shadow-sm mb-3">
                <Card.Body>
                  <Card.Title>All Members</Card.Title>
                  <div style={{ marginBottom: 10 }}>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Bulk message (use {name} to inject member name)"
                      value={bulkMessage}
                      onChange={e => setBulkMessage(e.target.value)}
                    />
                    <div className="d-flex gap-2 mt-2">
                      <Button onClick={async () => {
                        if (selectedMembers.length === 0) return alert('Select members first');
                        try {
                          // build per-recipient payloads with {name} replacement
                          const targets = members.filter(m => selectedMembers.includes(m.id));
                          const payloads = targets.map(t => ({ to: t.phone, message: bulkMessage.replace(/\{name\}/g, t.name) }));
                          const res = await fetch(`${getApiBase()}/api/sms/bulk`, {
                            method: 'POST',
                            headers: Object.assign({ 'Content-Type': 'application/json' }, authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                            body: JSON.stringify({ payloads })
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setSendResults(data.results || []);
                            alert('Messages queued');
                          } else {
                            alert(data.error || 'Failed');
                          }
                        } catch (err) { alert('Server error'); }
                      }}>Send Bulk</Button>
                      <Button variant="outline-primary" onClick={async () => {
                        // trigger birthday endpoint
                        try {
                          const res = await fetch(`${getApiBase()}/api/sms/birthday`, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, authToken ? { 'Authorization': `Bearer ${authToken}` } : {}), body: JSON.stringify({ template: null }) });
                          const data = await res.json();
                          if (res.ok) alert('Birthday send complete: ' + (data.count || 0)); else alert(data.error || 'Failed');
                        } catch (err) { alert('Server error'); }
                      }}>Send Birthday Messages</Button>
                    </div>
                    <div className="mt-3">
                      <Form.Label><strong>Birthday Template</strong> (use {name})</Form.Label>
                      <Form.Control as="textarea" rows={3} value={birthdayTemplate} onChange={e => setBirthdayTemplate(e.target.value)} />
                      <div className="d-flex gap-2 mt-2">
                        <Button onClick={async () => {
                          try {
                            const res = await fetch(`${getApiBase()}/api/sms/birthday-template`, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, authToken ? { 'Authorization': `Bearer ${authToken}` } : {}), body: JSON.stringify({ template: birthdayTemplate }) });
                            const data = await res.json();
                            if (res.ok) setTemplateMsg('Template saved'); else setTemplateMsg(data.error || 'Save failed');
                          } catch (e) { setTemplateMsg('Server error'); }
                        }}>Save Template</Button>
                        <Button variant="secondary" onClick={async () => {
                          // send to selected members using template
                          if (selectedMembers.length === 0) return alert('Select members first');
                          try {
                            const targets = members.filter(m => selectedMembers.includes(m.id));
                            const payloads = targets.map(t => ({ to: t.phone, message: (birthdayTemplate || '').replace(/\{name\}/g, t.name) }));
                            const res = await fetch(`${getApiBase()}/api/sms/bulk`, {
                              method: 'POST',
                              headers: Object.assign({ 'Content-Type': 'application/json' }, authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                              body: JSON.stringify({ payloads })
                            });
                            const data = await res.json();
                            if (res.ok) { setSendResults(data.results || []); alert('Birthday messages queued'); } else alert(data.error || 'Failed');
                          } catch (e) { alert('Server error'); }
                        }}>Send Birthday to Selected</Button>
                        {templateMsg && <span className="ms-2">{templateMsg}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 d-flex align-items-center">
                    <Form.Check className="me-2" label="Select all" checked={selectAll} onChange={e => {
                      const checked = e.target.checked;
                      setSelectAll(checked);
                      if (checked) setSelectedMembers(members.map(m => m.id)); else setSelectedMembers([]);
                    }} />
                  </div>
                  <ListGroup>
                    {members.map(m => (
                      <ListGroup.Item key={m.id} className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <Form.Check className="me-3" checked={selectedMembers.includes(m.id)} onChange={e => {
                            if (e.target.checked) setSelectedMembers(prev => [...prev, m.id]); else setSelectedMembers(prev => prev.filter(id => id !== m.id));
                            // unset selectAll if any deselected
                            if (!e.target.checked) setSelectAll(false);
                          }} />
                          <div>
                            <div>{m.name} ({m.phone}) - <Badge bg={m.type === 'old' ? 'secondary' : 'success'}>{m.type === 'old' ? 'Old Member' : 'New Member'}</Badge></div>
                            {m.dob && <small className="text-muted">DOB: {m.dob}</small>}
                          </div>
                        </div>
                        <div>
                          <Button size="sm" variant="link" onClick={() => { setActiveMember(m); setShowMemberModal(true); }}>View</Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  <Modal show={showMemberModal} onHide={() => setShowMemberModal(false)}>
                    <Modal.Header closeButton>
                      <Modal.Title>Member Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {activeMember ? (
                        <div>
                          <p><strong>Name:</strong> {activeMember.name}</p>
                          <p><strong>Phone:</strong> {activeMember.phone}</p>
                          <p><strong>Type:</strong> {activeMember.type}</p>
                          <p><strong>DOB:</strong> {activeMember.dob || 'N/A'}</p>
                          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(activeMember, null, 2)}</pre>
                        </div>
                      ) : <div>No member</div>}
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowMemberModal(false)}>Close</Button>
                    </Modal.Footer>
                  </Modal>
                  {sendResults.length > 0 && (
                    <Card className="mt-3">
                      <Card.Body>
                        <Card.Title>Send Results</Card.Title>
                        <ListGroup>
                          {sendResults.map((r, idx) => (
                            <ListGroup.Item key={idx}>
                              {r.to} - {r.sid ? `SID: ${r.sid}` : `Error: ${r.error}`}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm mb-3">
                <Card.Body>
                  <Card.Title>All Payments</Card.Title>
                  <ListGroup>
                    {payments.map(p => {
                      const mem = members.find(m => m.id === p.memberId);
                      return (
                        <ListGroup.Item key={p.id}>
                          {mem ? mem.name : 'Unknown'} - {p.type} - GHS {p.amount} <span className="text-muted">({p.date && p.date.slice(0,10)})</span>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}


function App() {
  const [view, setView] = useState('member');
  const [loggedIn, setLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [debugFetch, setDebugFetch] = useState('');
  const [serverStatus, setServerStatus] = useState('unknown');
  const [apiOverride, setApiOverride] = useState(() => { try { return localStorage.getItem('api_base_override') || ''; } catch(e) { return ''; } });

  // helper to check server health
  const checkServer = async () => {
    try {
  const r = await fetch(`${getApiBase()}/`);
      if (r.ok) {
        setServerStatus('ok');
        return true;
      }
      setServerStatus('error');
      return false;
    } catch (e) {
      setServerStatus('error');
      return false;
    }
  };

  // restore token from localStorage if present
  useEffect(() => {
    try {
      const t = localStorage.getItem('admin_token');
      if (t) {
        setAuthToken(t);
        setLoggedIn(true);
        setView('admin');
      }
    } catch (e) {}
    // quick server ping on load
    checkServer();
    // keep retrying every 10s until server becomes available (helps if backend starts after frontend)
    const id = setInterval(() => {
      if (serverStatus === 'ok') return;
      checkServer();
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <Container fluid className="p-0">
      <Navbar bg="light" expand="lg" className="mb-4 rounded shadow-sm">
        <Container>
          <Navbar.Brand href="#">
            <img src={pcgLogo} alt="Christ Congregation Nkawkaw Logo" className="logo styled-logo me-2" style={{width:50, height:50}} />
            <span className="fw-bold">Christ Congregation Nkawkaw — Presbyterian Church of Ghana</span>
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link onClick={() => setView('member')}>Member</Nav.Link>
            <Nav.Link onClick={() => setView('admin')}>Admin</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <div style={{ position: 'fixed', right: 12, top: 80, zIndex: 1050 }}>
        <div style={{ background: '#fff', padding: 8, borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', fontSize: 12 }}>
          <div><strong>DEBUG</strong></div>
          <div>view: {view}</div>
          <div>loggedIn: {loggedIn ? 'true' : 'false'}</div>
          <div>token: {authToken ? (String(authToken).slice(0,8) + '...') : 'none'}</div>
          <div style={{ marginTop: 6, color: '#444' }}>check: {debugFetch || 'idle'}</div>
          <div style={{ marginTop: 4, color: serverStatus === 'ok' ? 'green' : '#a00' }}>server: {serverStatus}</div>
          <div style={{ marginTop: 6 }}>
            <label style={{ fontSize: 11, color: '#666' }}>API base override</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input value={apiOverride} onChange={e => setApiOverride(e.target.value)} placeholder="http://192.168.1.10:5001" style={{ fontSize: 12, padding: '4px 6px', width: 200 }} />
              <button onClick={() => { try { localStorage.setItem('api_base_override', apiOverride); checkServer(); alert('Saved override'); } catch(e){ alert('Save failed'); } }} style={{ fontSize: 12, padding: '4px 6px' }}>Save</button>
              <button onClick={() => { try { localStorage.removeItem('api_base_override'); setApiOverride(''); checkServer(); alert('Cleared override'); } catch(e){ alert('Clear failed'); } }} style={{ fontSize: 12, padding: '4px 6px' }}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      {view === 'admin' ? (
        loggedIn ? (
          <AdminPortal authToken={authToken} onLogout={() => { try { localStorage.removeItem('admin_token'); } catch (e) {}; setLoggedIn(false); setAuthToken(null); setView('member'); }} />
        ) : (
          <Login serverStatus={serverStatus} checkServer={checkServer} onLogin={(token) => { try { localStorage.setItem('admin_token', token); } catch(e){}; setAuthToken(token); setLoggedIn(true); setView('admin');
              // immediately validate token by fetching members and show result in debug panel
              (async () => {
                try {
                  const res = await fetch(`${getApiBase()}/api/members`, { headers: { 'Authorization': `Bearer ${token}` } });
                  if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    setDebugFetch('fetch-error: ' + (err?.error || res.status));
                  } else {
                    const data = await res.json();
                    setDebugFetch('fetch-ok: ' + (Array.isArray(data) ? data.length + ' members' : JSON.stringify(data)));
                  }
                } catch (e) { setDebugFetch('fetch-exception'); }
              })();
            }} />
        )
      ) : (
        <Member />
      )}
    </Container>
  );
}

export default App;

