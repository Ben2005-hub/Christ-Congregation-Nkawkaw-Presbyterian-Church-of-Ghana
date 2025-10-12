import { useState } from 'react';
import './App.css';
import getApiBase from './apiBase';
import { Container, Card, Button, Form, Navbar } from 'react-bootstrap';

const pcgLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Presbyterian_Church_of_Ghana_Crest.png/330px-Presbyterian_Church_of_Ghana_Crest.png';


export default function Member() {
  const [member, setMember] = useState({ name: '', phone: '', type: 'new', dob: '' });
  const [msg, setMsg] = useState('');
  const [registered, setRegistered] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [payment, setPayment] = useState({ amount: '', type: 'tithe' });
  const [paymentMsg, setPaymentMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
  const res = await fetch(`${getApiBase()}/api/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Registration successful!');
        setRegistered(true);
        setMemberId(data.id || null);
        setMember({ name: '', phone: '', type: 'new', dob: '' });
      } else {
        setMsg(data.error || 'Registration failed');
      }
    } catch {
      setMsg('Server error');
    }
  };

  return (
    <Container className="py-4">
      <Navbar bg="light" expand="lg" className="mb-4 rounded shadow-sm">
        <Container>
          <Navbar.Brand href="#">
            <img src={pcgLogo} alt="Christ Congregation Nkawkaw Logo" className="logo styled-logo me-2" style={{width:50, height:50}} />
            <span className="fw-bold">Christ Congregation Nkawkaw — Presbyterian Church of Ghana</span>
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Card className="member-card mx-auto shadow-sm">
        <Card.Body>
          <Card.Title>Member Registration</Card.Title>
          {registered ? (
            <div>
              <p className="text-success">{msg}</p>
              <Button variant="primary" onClick={() => setRegistered(false)}>Register Another</Button>
            </div>
          ) : (
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
          )}
          {msg && !registered && <p className="mt-2 text-danger">{msg}</p>}
          <hr />
          <Card.Title>Make a Payment</Card.Title>
          <Form onSubmit={async (e) => {
            e.preventDefault();
            setPaymentMsg('');
            try {
              // Use stored memberId if we just registered, else try public lookup
              let idToUse = memberId;
              if (!idToUse) {
                  const resMembers = await fetch(`${getApiBase()}/api/members/public`);
                const all = await resMembers.json().catch(() => []);
                const me = all.find(m => m.phone === member.phone);
                if (!me) { setPaymentMsg('Register first or use the registered phone number'); return; }
                idToUse = me.id;
              }
              const res = await fetch(`${getApiBase()}/api/payments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: idToUse, amount: payment.amount, type: payment.type })
              });
              const d = await res.json();
              if (res.ok) { setPaymentMsg('Payment recorded. Thank you!'); setPayment({ amount: '', type: 'tithe' }); } else { setPaymentMsg(d.error || 'Payment failed'); }
            } catch (err) { setPaymentMsg('Server error'); }
          }}>
            <Form.Group className="mb-2">
              <Form.Control type="number" placeholder="Amount (GHS)" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Select value={payment.type} onChange={e => setPayment({ ...payment, type: e.target.value })}>
                <option value="tithe">Tithe</option>
                <option value="funeral">Funeral Due</option>
              </Form.Select>
            </Form.Group>
            <Button type="submit" className="w-100">Pay</Button>
            {paymentMsg && <p className="mt-2 text-primary">{paymentMsg}</p>}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
