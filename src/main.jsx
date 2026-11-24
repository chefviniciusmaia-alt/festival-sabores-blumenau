
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hzalixgdhsnsacyinftk.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function App() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [pratos, setPratos] = useState([]);
  const [sessao, setSessao] = useState(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [cadastro, setCadastro] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMensagem('Conexão com o sistema indisponível. Verifique a configuração.');
      return;
    }

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
    if (!supabase) return;

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

    if (!supabase) {
      setMensagem('Sistema indisponível. Verifique a conexão.');
      return;
    }

    const resultado = cadastro
      ? await supabase.auth.signUp({ email, password: senha })
      : await supabase.auth.signInWithPassword({ email, password: senha });

    setMensagem(
      resultado.error
        ? resultado.error.message
        : cadastro
        ? 'Cadastro realizado! Confira seu e-mail.'
        : 'Login realizado com sucesso!'
    );
  }

  async function votar(prato) {
    if (!sessao) {
      setMensagem('Faça login para participar da votação.');
      document.getElementById('participar')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const { error } = await supabase.rpc('cast_festival_vote', {
      p_restaurant_id: prato.restaurant_id,
      p_dish_id: prato.id
    });

    setMensagem(error ? error.message : 'Seu voto foi registrado!');
  }

  async function sair() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMensagem('Você saiu da sua conta.');
  }

  const scrollToSection = (id) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="festival-app">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">S</span>
          <span className="brand-text">
            SABORES
            <small>BLUMENAU</small>
          </span>
        </a>

        <button className="menu-toggle" onClick={() => setMenu(!menu)}>
          {menu ? 'FECHAR' : 'MENU'}
        </button>

        <nav className={menu ? 'navigation open' : 'navigation'}>
          <button onClick={() => scrollToSection('inicio')}>INÍCIO</button>
          <button onClick={() => scrollToSection('experiencia')}>O FESTIVAL</button>
          <button onClick={() => scrollToSection('restaurantes')}>RESTAURANTES</button>
          <button onClick={() => scrollToSection('votacao')}>VOTAÇÃO</button>
          <button onClick={() => scrollToSection('participar')}>MINHA CONTA</button>
        </nav>
      </header>

      <main>
        <section className="hero-premium" id="inicio">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <span className="eyebrow">BLUMENAU • SANTA CATARINA</span>
            <div className="hero-line"></div>
            <h1>Uma cidade.<br /><em>Mil sabores.</em></h1>
            <p>Uma celebração da gastronomia, da criatividade e dos sabores que fazem Blumenau única.</p>
            <button className="gold-button" onClick={() => scrollToSection('restaurantes')}>
              EXPLORAR FESTIVAL <span>↗</span>
            </button>
            <div className="hero-date">
              <span>25 JUN</span>
              <span className="date-divider">—</span>
              <span>25 JUL 2027</span>
            </div>
          </div>
          <div className="hero-bottom-label">FESTIVAL GASTRONÔMICO DE BLUMENAU</div>
        </section>

        <section className="intro-section" id="experiencia">
          <div className="section-kicker">UMA EXPERIÊNCIA INESQUECÍVEL</div>
          <h2>Descubra. Experimente.<br /><em> apaixone-se.</em></h2>
          <p>
            Um convite para explorar a cidade por meio da gastronomia.
            Restaurantes, chefs, sabores autorais e experiências especiais
            reunidos em um só festival.
          </p>
          <div className="intro-stats">
            <div><strong>30</strong><span>DIAS DE FESTIVAL</span></div>
            <div><strong>1</strong><span>CIDADE DE SABORES</span></div>
            <div><strong>∞</strong><span>EXPERIÊNCIAS</span></div>
          </div>
        </section>

        <section className="restaurants-section" id="restaurantes">
          <div className="section-kicker">ROTEIRO GASTRONÔMICO</div>
          <h2>Explore os <em>sabores</em></h2>
          <p className="section-description">
            Descubra os estabelecimentos participantes e suas criações exclusivas.
          </p>

          {restaurantes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✦</span>
              <h3>Novos sabores estão chegando</h3>
              <p>Os restaurantes participantes serão revelados em breve.</p>
            </div>
          ) : (
            <div className="restaurant-grid">
              {restaurantes.map((restaurante, index) => {
                const pratosDoRestaurante = pratos.filter(
                  prato => prato.restaurant_id === restaurante.id
                );

                return (
                  <article className="restaurant-card" key={restaurante.id}>
                    <div className="restaurant-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <h3>{restaurante.name}</h3>
                    <p className="restaurant-description">{restaurante.description}</p>
                    <p className="restaurant-address">{restaurante.address}</p>

                    {pratosDoRestaurante.map(prato => (
                      <div className="dish-card" key={prato.id}>
                        {prato.image_url ? (
                          <img src={prato.image_url} alt={prato.name} />
                        ) : (
                          <div className="dish-placeholder">SABORES</div>
                        )}
                        <div className="dish-info">
                          <h4>{prato.name}</h4>
                          <p>{prato.description}</p>
                          {prato.price != null && (
                            <strong>
                              {Number(prato.price).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </strong>
                          )}
                          <button className="vote-button" onClick={() => votar(prato)}>
                            VOTAR NESTE PRATO ↗
                          </button>
                        </div>
                      </div>
                    ))}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="vote-section" id="votacao">
          <div className="vote-decoration">✦</div>
          <div className="section-kicker">A SUA ESCOLHA FAZ PARTE</div>
          <h2>Qual sabor merece<br /><em>o primeiro lugar?</em></h2>
          <p>
            Experimente, descubra seu favorito e participe da votação
            que celebra os talentos gastronômicos da nossa cidade.
          </p>
          <button className="gold-button" onClick={() => scrollToSection('restaurantes')}>
            DESCOBRIR OS PRATOS ↗
          </button>
        </section>

        <section className="account-section" id="participar">
          <div className="account-box">
            <div className="section-kicker">PARTICIPE</div>
            <h2>Faça parte desta <em>experiência.</em></h2>

            {sessao ? (
              <div className="account-logged">
                <p>Você está conectado.</p>
                <p className="account-email">{sessao.user.email}</p>
                <button className="gold-button" onClick={sair}>SAIR DA CONTA</button>
              </div>
            ) : (
              <>
                <p className="account-description">
                  Crie sua conta ou entre para participar da votação do festival.
                </p>
                <form onSubmit={entrar} className="account-form">
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
                  <button className="gold-button">
                    {cadastro ? 'CRIAR MINHA CONTA' : 'ENTRAR'}
                  </button>
                </form>
                <button className="account-switch" onClick={() => setCadastro(!cadastro)}>
                  {cadastro ? 'Já possui conta? Entrar' : 'Ainda não possui conta? Cadastre-se'}
                </button>
              </>
            )}

            {mensagem && <div className="notice-message">{mensagem}</div>}
          </div>
        </section>
      </main>

      <footer className="festival-footer">
        <div className="footer-brand">SABORES <span>BLUMENAU</span></div>
        <p>Festival Gastronômico de Blumenau</p>
        <p>25 de junho — 25 de julho de 2027</p>
        <div className="footer-line"></div>
        <small>REALIZAÇÃO • CVM CONSULTORIA GASTRONÔMICA</small>
        <small>© 2027 FESTIVAL SABORES DE BLUMENAU</small>
      </footer>

      <div className="mobile-bottom-nav">
        <button onClick={() => scrollToSection('inicio')}>⌂<span>INÍCIO</span></button>
        <button onClick={() => scrollToSection('restaurantes')}>✦<span>EXPLORAR</span></button>
        <button onClick={() => scrollToSection('votacao')}>♛<span>VOTAR</span></button>
        <button onClick={() => scrollToSection('participar')}>◉<span>CONTA</span></button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
