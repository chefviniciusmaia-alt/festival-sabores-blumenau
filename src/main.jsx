
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './style.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://hzalixgdhsnsacyinftk.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

function App() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [pratos, setPratos] = useState([]);
  const [sessao, setSessao] = useState(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [cadastro, setCadastro] = useState(false);

  useEffect(() => {
    carregar();
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setSessao(session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function carregar() {
    const { data: r } = await supabase
      .from('restaurants')
      .select('*')
      .eq('status', 'approved');

    const { data: d } = await supabase
      .from('dishes')
      .select('*')
      .eq('active', true);

    setRestaurantes(r || []);
    setPratos(d || []);
  }

  async function entrar(e) {
    e.preventDefault();
    setMensagem('');

    const resultado = cadastro
      ? await supabase.auth.signUp({ email, password: senha })
      : await supabase.auth.signInWithPassword({ email, password: senha });

    setMensagem(
      resultado.error
        ? resultado.error.message
        : cadastro
        ? 'Cadastro realizado! Confira seu e-mail.'
        : 'Login realizado!'
    );
  }

  async function votar(prato) {
    if (!sessao) {
      setMensagem('Entre na sua conta para votar.');
      return;
    }

    const { error } = await supabase.rpc('cast_festival_vote', {
      p_restaurant_id: prato.restaurant_id,
      p_dish_id: prato.id
    });

    setMensagem(error ? error.message : 'Seu voto foi registrado!');
  }

  async function sair() {
    await supabase.auth.signOut();
    setMensagem('Você saiu da sua conta.');
  }

  return (
    <div>
      <header>
        <div className="logo">SABORES <span>BLUMENAU</span></div>
        <div className="sublogo">FESTIVAL GASTRONÔMICO</div>
      </header>

      <section className="hero">
        <p>25 JUNHO — 25 JULHO 2027</p>
        <h1>Uma cidade.<br /><span>Mil sabores.</span></h1>
        <p>Descubra experiências gastronômicas únicas em Blumenau.</p>
        <a href="#restaurantes" className="botao">EXPLORAR FESTIVAL</a>
      </section>

      <section className="participar">
        <h2>Participe do festival</h2>
        {sessao ? (
          <div>
            <p>Conectado: {sessao.user.email}</p>
            <button onClick={sair}>SAIR</button>
          </div>
        ) : (
          <form onSubmit={entrar}>
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              minLength={6}
            />
            <button>{cadastro ? 'CRIAR CONTA' : 'ENTRAR'}</button>
            <p onClick={() => setCadastro(!cadastro)} className="alternar">
              {cadastro ? 'Já tenho conta' : 'Criar minha conta'}
            </p>
          </form>
        )}
        {mensagem && <p className="mensagem">{mensagem}</p>}
      </section>

      <section id="restaurantes" className="catalogo">
        <p className="dourado">ROTEIRO GASTRONÔMICO</p>
        <h2>Conheça os participantes</h2>

        {restaurantes.length === 0 && (
          <p>Os participantes serão divulgados em breve.</p>
        )}

        {restaurantes.map(restaurante => (
          <article className="restaurante" key={restaurante.id}>
            <h3>{restaurante.name}</h3>
            <p>{restaurante.description}</p>
            <p>{restaurante.address}</p>

            {pratos
              .filter(prato => prato.restaurant_id === restaurante.id)
              .map(prato => (
                <div className="prato" key={prato.id}>
                  {prato.image_url && (
                    <img src={prato.image_url} alt={prato.name} />
                  )}
                  <div>
                    <h4>{prato.name}</h4>
                    <p>{prato.description}</p>
                    {prato.price && <p>R$ {prato.price}</p>}
                  </div>
                  <button onClick={() => votar(prato)}>VOTAR</button>
                </div>
              ))}
          </article>
        ))}
      </section>

      <footer>
        <h3>FESTIVAL SABORES DE BLUMENAU</h3>
        <p>Realização CVM Consultoria Gastronômica</p>
        <p>25/06/2027 — 25/07/2027</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
