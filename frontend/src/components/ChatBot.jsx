import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Typography, Tooltip, Space } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined, UserOutlined, BulbOutlined } from '@ant-design/icons';
import { sendChatMessage } from '../services/api';

const { Text } = Typography;

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: <span className="sparkle-text">Hi! I am Sparky ✨ How can I help you use the Release Incident Correlator today?</span> }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Show tooltip and bounce after a short delay
    const startTimer = setTimeout(() => {
      if (!isOpen) {
        setShowTooltip(true);
        setIsBouncing(true);
      }
    }, 2000);

    // Stop bouncing and hide tooltip after 10 seconds
    const stopTimer = setTimeout(() => {
      setShowTooltip(false);
      setIsBouncing(false);
    }, 12000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (msgText = inputMsg) => {
    if (!msgText.trim()) return;

    const userMessage = { role: 'user', content: msgText.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (msgText === inputMsg) setInputMsg('');
    setIsLoading(true);

    try {
      // Pass pure strings to API (filter out React elements from assistant if needed, though they shouldn't be sent)
      const apiMessages = newMessages.map(m => ({ 
        role: m.role, 
        content: typeof m.content === 'string' ? m.content : 'Hi! I am Sparky, how can I help?' 
      }));
      const res = await sendChatMessage(apiMessages);
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: 'Oops! Something went wrong. ' + e.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SUGGESTIONS = [
    'How do I upload incidents?',
    'What is blast radius?',
    'How does the AI work?'
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Tooltip title="Click me, ask your queries ✨" placement="left" open={showTooltip} onOpenChange={setShowTooltip}>
          <Button
            type="primary"
            shape="circle"
            className={isBouncing ? 'animate-bounce' : ''}
            icon={<MessageOutlined style={{ fontSize: '24px' }} />}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              width: '60px',
              height: '60px',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Tooltip>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '350px',
          height: '500px',
          background: '#16161d',
          border: '1px solid #2a2a3e',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1f1f2e 0%, #161622 100%)',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #2a2a3e',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
              }}>
                <RobotOutlined style={{ color: '#fff', fontSize: '18px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ color: '#e2e2f0', fontWeight: 'bold', fontSize: '15px', lineHeight: '1.2' }} className="sparkle-text">Sparky</Text>
                <Text style={{ color: '#10b981', fontSize: '11px', fontWeight: '600' }}>● Online</Text>
              </div>
            </div>
            <Button 
              type="text" 
              className="chat-box-hover"
              icon={<CloseOutlined style={{ color: '#9898b8' }} />} 
              onClick={() => setIsOpen(false)} 
            />
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  color: '#9898b8',
                  fontSize: '12px'
                }}>
                  {m.role === 'user' ? <><Text style={{color: '#9898b8', fontSize: 10}}>You</Text> <UserOutlined/></> : <><RobotOutlined/> <Text style={{color: '#9898b8', fontSize: 10}}>AI</Text></>}
                </div>
                <div 
                  className="chat-box-hover"
                  style={{
                  background: m.role === 'user' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : '#ffffff',
                  color: m.role === 'user' ? '#ffffff' : '#1f1f2e',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderTopRightRadius: m.role === 'user' ? '4px' : '16px',
                  borderTopLeftRadius: m.role === 'assistant' ? '4px' : '16px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  boxShadow: m.role === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
                  fontWeight: m.role === 'user' ? '500' : '500'
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: '#1f1f2e', padding: '10px 14px', borderRadius: '12px', borderTopLeftRadius: '0' }}>
                <Spin size="small" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #2a2a3e',
            background: '#16161d'
          }}>
            {/* Suggestions Row */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              overflowX: 'auto', 
              marginBottom: '10px', 
              paddingBottom: '4px' 
            }}
            className="scrollbar-hide"
            >
              {SUGGESTIONS.map((sug, idx) => (
                <Button 
                  key={idx} 
                  size="small" 
                  shape="round"
                  className="chat-box-hover"
                  onClick={() => handleSend(sug)}
                  style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    borderColor: '#a855f7',
                    color: '#e9d5ff',
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    padding: '0 12px'
                  }}
                >
                  <BulbOutlined /> {sug}
                </Button>
              ))}
            </div>

            <Input
              className="chat-box-hover"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onPressEnter={() => handleSend(inputMsg)}
              placeholder="Ask Sparky..."
              suffix={
                <Button 
                  type="text" 
                  icon={<SendOutlined style={{ color: inputMsg.trim() ? '#6366f1' : '#4a4a6a' }} />} 
                  onClick={() => handleSend(inputMsg)}
                  disabled={!inputMsg.trim() || isLoading}
                />
              }
              style={{
                background: '#0d0d1a',
                border: '1px solid #2a2a3e',
                color: '#e2e2f0',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
