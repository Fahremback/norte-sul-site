
import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import Button from './Button';
import BookOpenIcon from './icons/BookOpenIcon';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const isRecordedCourse = course.type === 'GRAVADO';
  const placeholderImageUrl = `https://via.placeholder.com/600x400.png?text=${encodeURIComponent(course.title)}`;

  return (
    <div className="bg-background-card rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:scale-105 transition-transform duration-300 ease-in-out border border-border-light hover:shadow-xl h-full">
      <Link to={`/courses/${course.id}`} aria-label={`Ver detalhes do curso ${course.title}`} className="relative">
        <img 
          src={course.imageUrl || placeholderImageUrl} 
          alt={course.title} 
          className={`w-full h-48 object-cover transition-all duration-300 ${isRecordedCourse ? 'filter blur-sm' : ''}`}
          loading="lazy"
          decoding="async"
        />
        {isRecordedCourse && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <span className="text-white text-sm font-bold bg-black bg-opacity-60 px-3 py-1 rounded-md">Requer Aprovação</span>
          </div>
        )}
      </Link>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-brand-primary mb-2 min-h-[3.5em]">
          <Link to={`/courses/${course.id}`} className="hover:underline">{course.title}</Link>
        </h3>
        <p className="text-xs text-text-muted mb-1">Instrutor(a): {course.instructor}</p>
        <p className="text-xs text-text-muted mb-3">Duração: {course.duration} {course.level && `(${course.level})`}</p>
        <p className="text-text-muted text-sm mb-4 flex-grow min-h-[4.5em] line-clamp-3">{course.description}</p>
        <div className="mt-auto">
          <p className="text-2xl font-bold text-text-headings mb-4">
            R$ {course.price.toFixed(2).replace('.', ',')}
          </p>
          <Link to={`/courses/${course.id}`} className="w-full">
            <Button variant="primary" size="md" className="w-full flex items-center justify-center" aria-label={`Ver detalhes do curso ${course.title}`}>
              <BookOpenIcon className="w-5 h-5 mr-2" />
              Ver Curso
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
