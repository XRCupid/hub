import React, { useState } from 'react';
import { 
  CONVERSATION_MODULES, 
  CURIOSITY_CATEGORIES,
  CURIOSITY_PROMPTS,
  ConversationModule,
  CuriosityItem 
} from '../config/conversationModules';
import './ConversationToolkit.css';

interface ConversationToolkitProps {
  userId?: string;
}

export const ConversationToolkit: React.FC<ConversationToolkitProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'curiosity'>('modules');
  const [selectedModule, setSelectedModule] = useState<ConversationModule | null>(null);
  const [curiosityItems, setCuriosityItems] = useState<CuriosityItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'article' as const,
    title: '',
    description: '',
    source: '',
    tags: [] as string[],
    personalNote: ''
  });

  const categoryIcons: Record<string, string> = {
    anecdotes: '📖',
    questions: '❓',
    hypotheticals: '🌍',
    storytelling: '✨',
    curiosity: '💡'
  };

  const handleAddCuriosity = () => {
    const item: CuriosityItem = {
      id: Date.now().toString(),
      ...newItem,
      dateAdded: new Date(),
      sharedInConversation: false
    };
    setCuriosityItems([item, ...curiosityItems]);
    setShowAddForm(false);
    setNewItem({
      type: 'article',
      title: '',
      description: '',
      source: '',
      tags: [],
      personalNote: ''
    });
  };

  const renderModuleDetail = (module: ConversationModule) => {
    return (
      <div className="module-detail">
        <button className="back-button" onClick={() => setSelectedModule(null)}>
          ← Back to Modules
        </button>
        
        <div className="module-header">
          <span className="module-icon">{categoryIcons[module.category]}</span>
          <h2>{module.title}</h2>
        </div>
        
        <p className="module-description">{module.description}</p>
        
        <div className="examples-section">
          <h3>Examples</h3>
          {module.examples.map((example, idx) => (
            <div key={idx} className={`example-card ${example.type}`}>
              <div className="example-type">{example.type}</div>
              <div className="example-text">"{example.text}"</div>
              {example.context && (
                <div className="example-context">Context: {example.context}</div>
              )}
              {example.coachNote && (
                <div className="coach-note">
                  <span className="coach-icon">💡</span>
                  {example.coachNote}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="tips-section">
          <h3>Pro Tips</h3>
          <ul className="tips-list">
            {module.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
        
        <div className="practice-section">
          <h3>Practice Exercises</h3>
          {module.practiceExercises.map((exercise, idx) => (
            <div key={idx} className="practice-card">
              <div className="practice-prompt">{exercise.prompt}</div>
              <div className="guidance-points">
                {exercise.guidancePoints.map((point, pidx) => (
                  <div key={pidx} className="guidance-point">
                    <span className="point-bullet">→</span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderModulesList = () => {
    return (
      <div className="modules-grid">
        {CONVERSATION_MODULES.map(module => (
          <div 
            key={module.id} 
            className="module-card"
            onClick={() => setSelectedModule(module)}
          >
            <div className="module-icon">{categoryIcons[module.category]}</div>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
            <div className="module-category">{module.category}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderCuriosityBank = () => {
    return (
      <div className="curiosity-bank">
        <div className="curiosity-header">
          <h2>Your Curiosity Bank</h2>
          <button 
            className="add-curiosity-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add New Discovery
          </button>
        </div>

        {showAddForm && (
          <div className="add-form-overlay">
            <div className="add-form">
              <h3>Add to Your Curiosity Bank</h3>
              
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={newItem.type}
                  onChange={e => setNewItem({...newItem, type: e.target.value as any})}
                >
                  <option value="article">Article</option>
                  <option value="idea">Idea</option>
                  <option value="movie">Movie/Show</option>
                  <option value="book">Book</option>
                  <option value="podcast">Podcast</option>
                  <option value="question">Question</option>
                  <option value="fact">Fascinating Fact</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="What caught your attention?"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                  placeholder="What makes this interesting?"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Source (optional)</label>
                <input
                  type="text"
                  value={newItem.source}
                  onChange={e => setNewItem({...newItem, source: e.target.value})}
                  placeholder="Where did you find this?"
                />
              </div>

              <div className="form-group">
                <label>Personal Note</label>
                <textarea
                  value={newItem.personalNote}
                  onChange={e => setNewItem({...newItem, personalNote: e.target.value})}
                  placeholder="Why does this resonate with you?"
                  rows={2}
                />
              </div>

              <div className="form-buttons">
                <button onClick={() => setShowAddForm(false)}>Cancel</button>
                <button 
                  onClick={handleAddCuriosity}
                  disabled={!newItem.title}
                  className="primary"
                >
                  Add to Bank
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="curiosity-prompts">
          <h3>Today's Curiosity Prompt</h3>
          <div className="prompt-card">
            {CURIOSITY_PROMPTS.daily[Math.floor(Math.random() * CURIOSITY_PROMPTS.daily.length)]}
          </div>
        </div>

        <div className="curiosity-categories">
          {CURIOSITY_CATEGORIES.map(category => (
            <div key={category.id} className="category-section">
              <h3>
                <span className="category-icon">{category.icon}</span>
                {category.name}
              </h3>
              <div className="category-prompts">
                {category.prompts.map((prompt, idx) => (
                  <div key={idx} className="prompt-example">
                    "{prompt}"
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {curiosityItems.length > 0 && (
          <div className="curiosity-items">
            <h3>Your Collection</h3>
            <div className="items-grid">
              {curiosityItems.map(item => (
                <div key={item.id} className="curiosity-item">
                  <div className="item-type">{item.type}</div>
                  <h4>{item.title}</h4>
                  {item.description && <p>{item.description}</p>}
                  {item.personalNote && (
                    <div className="personal-note">
                      <em>"{item.personalNote}"</em>
                    </div>
                  )}
                  <div className="item-meta">
                    <span className="date">
                      {new Date(item.dateAdded).toLocaleDateString()}
                    </span>
                    {item.sharedInConversation && (
                      <span className="shared-badge">Shared ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="conversation-toolkit">
      <div className="toolkit-header">
        <h1>Conversation Toolkit</h1>
        <p>Build your repertoire of engaging conversations and track your intellectual curiosities</p>
      </div>

      <div className="toolkit-tabs">
        <button 
          className={activeTab === 'modules' ? 'active' : ''}
          onClick={() => setActiveTab('modules')}
        >
          Conversation Modules
        </button>
        <button 
          className={activeTab === 'curiosity' ? 'active' : ''}
          onClick={() => setActiveTab('curiosity')}
        >
          Curiosity Bank
        </button>
      </div>

      <div className="toolkit-content">
        {activeTab === 'modules' && (
          selectedModule ? renderModuleDetail(selectedModule) : renderModulesList()
        )}
        {activeTab === 'curiosity' && renderCuriosityBank()}
      </div>

      <div className="conversation-coach-tip">
        <div className="tip-header">
          <span className="tip-icon">✨</span>
          Coach Tip
        </div>
        <p>
          The best conversationalists aren't those who talk the most, but those who make 
          others feel most interesting. Use these tools to become genuinely curious about 
          the people you meet.
        </p>
      </div>
    </div>
  );
};
