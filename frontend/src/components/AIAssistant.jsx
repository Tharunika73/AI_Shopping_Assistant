import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // ADDED: Import useNavigate for navigation
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { setShowAIAssistant, setShowAuthModal } from '../store/uiSlice';
import { addToCart } from '../store/cartSlice';
import { toast } from 'sonner';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Send, 
  VolumeX, 
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { speechManager } from '../utils/speechUtils';
import api from '../utils/api';

const AIAssistant = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // ADDED: Initialize the navigate function
  const { showAIAssistant } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const handleMicClick = () => {
    if (!speechManager.isSupported()) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    if (isListening) {
      speechManager.stopListening();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      speechManager.startListening(
        (finalTranscript, interim) => {
          if (finalTranscript.trim()) {
            setQuery(finalTranscript.trim());
            setInterimTranscript('');
            handleSubmit(null, finalTranscript.trim());
          } else {
            setInterimTranscript(interim);
          }
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
          setInterimTranscript('');
          toast.error('Speech recognition failed. Please try again.');
        },
        () => {
          setIsListening(true);
        },
        () => {
          setIsListening(false);
          setInterimTranscript('');
        }
      );
    }
  };

  const handleSubmit = async (e, voiceQuery = null) => {
    if (e) e.preventDefault();
    
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    const queryText = voiceQuery || query.trim();
    if (!queryText) return;

    setIsLoading(true);
    setQuery('');

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: queryText,
      timestamp: new Date(),
    };

    setConversations(prev => [...prev, userMessage]);

    try {
      const response = await api.post('/ai/query', {
        query: queryText,
        limit: 8
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: response.data.reply_text,
        results: response.data.results || [],
        timestamp: new Date(),
      };

      setConversations(prev => [...prev, assistantMessage]);

      if (response.data.reply_text) {
        speechManager.speak(response.data.reply_text, () => {
          setIsSpeaking(false);
        });
        setIsSpeaking(true);
      }

    } catch (error) {
      console.error('AI query error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
        results: [],
        timestamp: new Date(),
      };
      setConversations(prev => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  // MODIFIED: Added 'e' parameter and stopPropagation to prevent navigation
  const handleAddToCart = async (e, productId) => {
    e.stopPropagation(); // Prevents the card's click event from firing
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    try {
      await dispatch(addToCart({ product_id: productId, quantity: 1 })).unwrap();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // ADDED: New function to handle clicking on a product card
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
    handleClose(); // Close the modal after navigating
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      speechManager.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const handleClose = () => {
    speechManager.stopListening();
    speechManager.stopSpeaking();
    setIsListening(false);
    setIsSpeaking(false);
    dispatch(setShowAIAssistant(false));
  };

  return (
    <>
      {/* Floating AI Button */}
      <Button
        onClick={() => dispatch(setShowAIAssistant(true))}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl z-50 transition-all duration-200 hover:scale-105"
        data-testid="ai-assistant-button"
        style={{ zIndex: 9999 }}
      >
        <Bot className="w-6 h-6 text-white" />
      </Button>

      {/* AI Assistant Modal */}
      <Dialog open={showAIAssistant} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col" data-testid="ai-assistant-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <span>AI Shopping Assistant</span>
              {isSpeaking && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSpeaking}
                  className="ml-auto"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-lg">
            {conversations.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <p className="text-lg font-medium">Hello! I'm your AI shopping assistant</p>
                <p className="text-sm mt-2">Ask me to find products, or use voice search by clicking the mic button!</p>
              </div>
            ) : (
              conversations.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-800 border'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    
                    {/* Product Results */}
                    {message.results && message.results.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.results.slice(0, 3).map((product) => (
                          // MODIFIED: Added onClick, cursor-pointer, and hover effect to the card
                          <Card 
                            key={product.product_id} 
                            className="overflow-hidden cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => handleProductClick(product.product_id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{product.title}</p>
                                  <p className="text-sm text-slate-500">${product.price}</p>
                                </div>
                                <Button
                                  size="sm"
                                  // MODIFIED: Pass the event 'e' to the handler
                                  onClick={(e) => handleAddToCart(e, product.product_id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  data-testid={`add-to-cart-${product.product_id}`}
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-lg px-4 py-2 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">AI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="mt-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={interimTranscript || "Ask me to find products..."}
                  className="pr-12"
                  data-testid="ai-query-input"
                />
                {interimTranscript && (
                  <div className="absolute inset-0 px-3 py-2 text-slate-400 pointer-events-none">
                    {interimTranscript}
                  </div>
                )}
              </div>
              
              <Button
                type="button"
                onClick={handleMicClick}
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={isListening ? "voice-recording" : ""}
                data-testid="voice-button"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                type="submit"
                disabled={!query.trim() || isLoading}
                data-testid="send-query-button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            
            {!speechManager.isSupported() && (
              <p className="text-xs text-slate-500 mt-2">
                Voice search is not supported in your browser
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIAssistant;