

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Course } from '../types';
import { fetchCourseById, requestCourseAccess } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import LockClosedIcon from '../components/icons/LockClosedIcon';
import NotFoundPage from './NotFoundPage';
import ShareIcon from '../components/icons/ShareIcon';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!courseId) {
      setError("ID do curso não fornecido.");
      setIsLoading(false);
      setCourse(null);
      return;
    }

    const loadCourse = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const courseData = await fetchCourseById(courseId);
        setCourse(courseData || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        setCourse(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      addToast("Você precisa estar logado para adicionar cursos ao carrinho.", "warning");
      navigate('/', { state: { openLoginModal: true } });
      return;
    }
    if (course) {
      addToCart(course, 1);
    }
  };

  const handleRequestAccess = async () => {
    if (!isAuthenticated) {
      addToast("Você precisa estar logado para solicitar acesso.", "warning");
      navigate('/', { state: { openLoginModal: true } });
      return;
    }
    if (!course) return;

    setRequestStatus('loading');
    try {
      await requestCourseAccess(course.id);
      setRequestStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar solicitação.');
      setRequestStatus('error');
    }
  };

  const handleShare = async () => {
    if (!course) return;
    const shareData = {
      title: course.title,
      text: `Confira este curso na Norte Sul Informática: ${course.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        addToast('Link do curso copiado!', 'info');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      addToast('Não foi possível compartilhar o curso.', 'error');
    }
  };
  
  const renderActionButtons = () => {
    if (!course) return null;

    const shareButton = (
      <Button 
          variant="outline"
          size="lg"
          className="w-full sm:w-auto px-4 flex-shrink-0"
          onClick={handleShare}
          aria-label={`Compartilhar curso: ${course.title}`}
      >
          <ShareIcon className="w-6 h-6" />
      </Button>
    );

    let mainActionButton;

    if (course.type === 'PRESENCIAL' || course.hasAccess) {
      mainActionButton = (
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full flex items-center justify-center"
          onClick={handleAddToCart}
          aria-label={`Adicionar ao carrinho: ${course.title}`}
        >
          <ShoppingCartIcon className="w-6 h-6 mr-2.5" />
          Adicionar ao Carrinho
        </Button>
      );
    } else if (course.type === 'GRAVADO' && !course.hasAccess) {
        if (requestStatus === 'idle') {
            mainActionButton = (
            <Button 
                variant="secondary" 
                size="lg" 
                className="w-full flex items-center justify-center"
                onClick={handleRequestAccess}
            >
                <LockClosedIcon className="w-6 h-6 mr-2.5" />
                Solicitar Acesso
            </Button>
            );
        } else if (requestStatus === 'loading') {
            mainActionButton = <Button variant="secondary" size="lg" className="w-full" disabled>Enviando...</Button>;
        } else if (requestStatus === 'success') {
            mainActionButton = <p className="text-center text-green-600 bg-green-100 p-3 rounded-md w-full">✅ Solicitação enviada! Você será notificado.</p>;
        } else { // error
            mainActionButton = <p className="text-center text-red-600 bg-red-100 p-3 rounded-md w-full">❌ {error || 'Não foi possível enviar a solicitação.'}</p>;
        }
    }

    if (!mainActionButton) return null;

     return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex-grow w-full">{mainActionButton}</div>
                {shareButton}
            </div>
            {course.type === 'GRAVADO' && !course.hasAccess && (
            <p className="text-xs text-text-muted text-center">Este é um curso com conteúdo gravado. O acesso para compra precisa ser aprovado por um administrador.</p>
            )}
        </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-6"></div>
        <p className="text-text-muted text-xl">Carregando detalhes do curso...</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="py-12 text-center bg-red-50 p-8 rounded-lg border border-red-200">
        <p className="text-red-700 text-2xl mt-6 mb-3 font-semibold">Erro ao Carregar Curso</p>
        <p className="text-text-muted mb-6">{error}</p>
        <Link to="/courses"><Button variant="primary" size="lg">Voltar aos Cursos</Button></Link>
      </div>
    );
  }

  if (!course) {
    return <NotFoundPage />;
  }
  
  const placeholderImageUrl = `https://via.placeholder.com/800x450.png?text=${encodeURIComponent(course.title)}`;

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start bg-background-card p-6 sm:p-8 rounded-xl shadow-xl border border-border-light">
          <div className={`aspect-video rounded-lg overflow-hidden shadow-md relative ${course.type === 'GRAVADO' && !course.hasAccess ? 'filter blur-md' : ''}`}>
            <img 
              src={course.imageUrl || placeholderImageUrl} 
              alt={course.title} 
              className="w-full h-full object-cover transition-transform duration-300"
            />
          </div>

          <div className="flex flex-col justify-between h-full">
            <div>
              <nav aria-label="breadcrumb" className="text-sm text-text-muted mb-2">
                <ol className="list-none p-0 inline-flex">
                  <li className="flex items-center">
                    <Link to="/courses" className="hover:text-brand-primary">Cursos</Link>
                    <svg className="fill-current w-3 h-3 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
                  </li>
                  <li className="flex items-center text-text-body">{course.title}</li>
                </ol>
              </nav>
              <h1 className="text-3xl lg:text-4xl font-bold text-brand-primary mb-3">{course.title}</h1>
              <p className="text-text-body text-base lg:text-lg mb-4 leading-relaxed">{course.description}</p>
              
              <div className="text-sm text-text-muted space-y-1 mb-4">
                <p>Instrutor(a): <span className="font-medium text-text-body">{course.instructor}</span></p>
                <p>Duração: <span className="font-medium text-text-body">{course.duration}</span></p>
                {course.level && <p>Nível: <span className="font-medium text-text-body">{course.level}</span></p>}
                <p>Tipo: <span className="font-medium text-text-body">{course.type === 'PRESENCIAL' ? 'Presencial' : 'Conteúdo Gravado'}</span></p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-4xl lg:text-5xl font-extrabold text-text-headings mb-6">
                R$ {course.price.toFixed(2).replace('.', ',')}
              </p>
              {renderActionButtons()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;