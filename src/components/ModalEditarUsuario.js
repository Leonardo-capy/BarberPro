import React, { useState, useEffect } from 'react';



function ModalEditarUsuario({ isOpen, usuario, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    usuario: '',
    role: 'barbeiro',
    senha: ''
  });

  useEffect(() => {
    if (usuario) {
      setFormData({
        id: usuario.id,
        usuario: usuario.usuario,
        role: usuario.role,
        senha: ''
      });
    }
  }, [usuario]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="modal"
      style={{
        display: 'block',
        position: 'fixed',
        zIndex: 9999,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div className="card" style={{ maxWidth: '400px', margin: '80px auto', padding: '30px' }}>
        <h2 style={{ color: '#00ffd5', marginBottom: '20px', textAlign: 'center' }}>
          Editar Colaborador
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              required
            />
            <label>Nome do Usuário</label>
          </div>

          <div className="input-group" style={{ marginTop: '25px' }}>
            <input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder=" "
            />
            <label>Nova Senha (deixe vazio para não alterar)</label>
          </div>

          {usuario?.id !== 1 && (
            <div style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '12px', color: '#00ffd5', display: 'block', marginBottom: '5px' }}>
                Cargo (Role)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="barbeiro">Barbeiro</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button type="submit" style={{ flex: 2 }}>SALVAR ALTERAÇÕES</button>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, background: '#333', color: 'white', boxShadow: 'none' }}
            >
              VOLTAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEditarUsuario;