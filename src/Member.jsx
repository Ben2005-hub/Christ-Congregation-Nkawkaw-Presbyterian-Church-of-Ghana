import { useState } from 'react';
import './App.css';
import { Container, Card, Button, Form, Navbar } from 'react-bootstrap';

const pcgLogo = 'https://www.nicepng.com/png/detail/219-2193162_presbyterian-church-of-ghana-logo-presbyterian-church-ghana.png';

export default function Member() {
  const [member, setMember] = useState({ name: '', phone: '', type: 'new', dob: '' });
  const [msg, setMsg] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:5001/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Registration successful!');
        setRegistered(true);
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
            <img src={pcgLogo} alt="Presbyterian Church of Ghana Logo" className="logo styled-logo me-2" style={{width:50, height:50}} />
            <span className="fw-bold">Presbyterian Church of Ghana</span>
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Card className="mx-auto shadow-sm" style={{maxWidth: 400}}>
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
        </Card.Body>
      </Card>
    </Container>
  );
}
