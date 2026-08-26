import { useState } from 'react';
import { useStudentStore } from '../store/studentStore';

export function NameInput() {
  const setStudentInfo = useStudentStore((s) => s.setStudentInfo);
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const idTrimmed = studentId.trim();
    const nameTrimmed = name.trim();

    if (!idTrimmed || !nameTrimmed) {
      setError('학번과 이름을 모두 입력해주세요.');
      return;
    }
    if (nameTrimmed.length > 20) {
      setError('이름은 20자 이내로 입력해주세요.');
      return;
    }
    setStudentInfo(idTrimmed, nameTrimmed);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
    marginBottom: 8,
    outline: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: '90%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>👋</div>
        <h2 style={{ marginBottom: 8 }}>환영합니다!</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
          선생님이 여러분의 학습 진도를 확인할 수 있어요.
          <br />
          학번과 이름을 입력하고 시작해보세요!
        </p>
        <input
          type="text"
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="학번 (예: 2401)"
          autoFocus
          style={inputStyle}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="이름"
          style={inputStyle}
        />
        {error && (
          <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: 8 }}>{error}</p>
        )}
        <button
          className="btn"
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '1rem',
            background: 'var(--accent-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          시작하기 🚀
        </button>
      </div>
    </div>
  );
}
