export function KnowledgeBase() {
  const categories = [
    {
      name: 'Getting Started',
      articles: [
        { title: 'Installation Guide', readTime: '5 min' },
        { title: 'First Match Setup', readTime: '8 min' },
        { title: 'Understanding RAWS Files', readTime: '12 min' }
      ]
    },
    {
      name: 'Advanced Strategy',
      articles: [
        { title: 'Roster Optimization', readTime: '15 min' },
        { title: 'Economy Management', readTime: '10 min' },
        { title: 'Scouting & Recruitment', readTime: '20 min' }
      ]
    },
    {
      name: 'Data Integration',
      articles: [
        { title: 'Using SATOR Statistics', readTime: '10 min' },
        { title: 'ROTAS Predictions', readTime: '12 min' },
        { title: 'Live Match Integration', readTime: '8 min' }
      ]
    }
  ];
  
  return (
    <section className="knowledge-section">
      <h2>Knowledge Base</h2>
      <p>Master the game with our comprehensive guides</p>
      
      <div className="knowledge-grid">
        {categories.map(cat => (
          <div key={cat.name} className="category-card">
            <h3>{cat.name}</h3>
            <ul>
              {cat.articles.map(article => (
                <li key={article.title}>
                  <a href="#">{article.title}</a>
                  <span className="read-time">{article.readTime}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
