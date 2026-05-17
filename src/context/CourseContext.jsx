import React, { createContext, useCallback, useContext, useState } from 'react';

const CourseContext = createContext(null);

const loadSavedCourses = () => {
  try {
    return JSON.parse(localStorage.getItem('recentCourses') || '[]');
  } catch {
    return [];
  }
};

const loadSelectedCourse = () => {
  try {
    const raw = localStorage.getItem('selectedCourse');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const CourseProvider = ({ children }) => {
  const [selectedCourse, setSelectedCourse] = useState(loadSelectedCourse);
  const [recentCourses, setRecentCourses] = useState(loadSavedCourses);

  const selectCourse = useCallback((course) => {
    setSelectedCourse(course);
    localStorage.setItem('selectedCourse', JSON.stringify(course));

    setRecentCourses((prev) => {
      const filtered = prev.filter((c) => c.id !== course.id);
      const updated = [course, ...filtered].slice(0, 10);
      localStorage.setItem('recentCourses', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCourse = useCallback(() => {
    setSelectedCourse(null);
    localStorage.removeItem('selectedCourse');
  }, []);

  return (
    <CourseContext.Provider value={{ selectedCourse, recentCourses, selectCourse, clearCourse }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);
