
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Course } from '../types';
import { fetchCourses } from '../services/api';
import CourseCard from '../components/CourseCard';
import SectionTitle from '../components/SectionTitle';
import Button from '../components/Button';
import CourseCardSkeleton from '../components/CourseCardSkeleton';

const CoursesPage: React.FC = () => {
  const { data: courses = [], isLoading, error, refetch } = useQuery<Course[], Error>({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  return (
    <div className="py-8">
      <SectionTitle 
        title="Nossos Cursos Online" 
        subtitle="Aprenda novas habilidades no seu ritmo, com cursos práticos, didáticos e focados nas suas necessidades." 
      />
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {[...Array(8)].map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      )}

      {error && !isLoading && (
         <div className="text-center py-10 bg-red-50 p-6 rounded-lg border border-red-200">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-xl mt-4 mb-2 font-semibold">Oops! Algo deu errado.</p>
          <p className="text-text-muted mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="primary" size="md">Tentar Novamente</Button>
        </div>
      )}

      {!isLoading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
      
      {!isLoading && !error && courses.length === 0 && (
        <div className="text-center py-10 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-yellow-700 text-xl mt-4 mb-2 font-semibold">Nenhum curso disponível no momento.</p>
          <p className="text-text-muted">Por favor, verifique novamente mais tarde ou entre em contato para mais informações.</p>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
