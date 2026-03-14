/**
 * HelpHub Component
 * Q&A section with expandable questions and blue AREPO theme
 * 
 * Uses exact color: #0066ff (Royal Blue)
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, MessageSquare, CheckCircle, Circle, ChevronDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

function HelpHub({ 
  questions, 
  selectedQuestion, 
  onQuestionClick,
  hubColor = '#0066ff',
  hubGlow = 'rgba(0, 102, 255, 0.4)'
}) {
  return (
    <GlassCard 
      hoverGlow={hubGlow}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5" style={{ color: hubColor }} />
          <h3 className="font-display font-semibold text-lg">Recent Questions</h3>
        </div>
        <button 
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ 
            backgroundColor: `${hubColor}15`,
            color: hubColor
          }}
        >
          Ask Question
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => {
          const isSelected = selectedQuestion?.id === question.id;
          const isAnswered = question.status === 'answered';
          
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.button
                onClick={() => onQuestionClick(question)}
                className={`
                  w-full p-4 rounded-xl border text-left transition-all duration-300
                  ${isSelected 
                    ? 'bg-[#0066ff]/10 border-[#0066ff]' 
                    : 'bg-void-mid border-mist hover:border-[#0066ff]/30'
                  }
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isAnswered ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate" />
                    )}
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-medium mb-2"
                      style={{ color: isSelected ? hubColor : '#ffffff' }}
                    >
                      {question.question}
                    </h4>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-slate">
                        <MessageSquare className="w-4 h-4" />
                        {question.answers} {question.answers === 1 ? 'answer' : 'answers'}
                      </span>
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: isAnswered ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 107, 0, 0.15)',
                          color: isAnswered ? '#00ff88' : '#ff6b00'
                        }}
                      >
                        {isAnswered ? 'Answered' : 'Open'}
                      </span>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <motion.div
                    animate={{ rotate: isSelected ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown 
                      className="w-5 h-5" 
                      style={{ color: isSelected ? hubColor : '#6a6a7a' }}
                    />
                  </motion.div>
                </div>

                {/* Expanded Answer */}
                <AnimatePresence>
                  {isSelected && isAnswered && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div 
                        className="mt-4 pt-4 border-t"
                        style={{ borderColor: 'rgba(0, 102, 255, 0.2)' }}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${hubColor}20` }}
                          >
                            <span className="text-sm font-medium" style={{ color: hubColor }}>
                              A
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate leading-relaxed">
                              This is a sample answer demonstrating the help hub functionality. 
                              In a real implementation, this would contain the actual answer 
                              content from the knowledge base or community responses.
                            </p>
                            <div className="mt-3 flex items-center gap-4">
                              <button 
                                className="text-xs transition-colors"
                                style={{ color: hubColor }}
                              >
                                Helpful
                              </button>
                              <button className="text-xs text-slate hover:text-white transition-colors">
                                Report
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-mist">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate">
            Showing {questions.length} of 1,847 questions
          </p>
          <button 
            className="text-sm font-medium transition-colors"
            style={{ color: hubColor }}
          >
            View All Questions →
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export default HelpHub;
