import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  // Sample data - you can replace this with real data later
  const [assignments] = useState([
    { id: 1, name: 'Math Quiz 1', grade: 95, maxPoints: 100, subject: 'Mathematics' },
    { id: 2, name: 'English Essay', grade: 88, maxPoints: 100, subject: 'English' },
    { id: 3, name: 'Science Lab', grade: 92, maxPoints: 100, subject: 'Science' },
    { id: 4, name: 'History Test', grade: 89, maxPoints: 100, subject: 'History' },
    { id: 5, name: 'Math Quiz 2', grade: 97, maxPoints: 100, subject: 'Mathematics' },
  ]);

  // Calculate overall average
  const calculateOverallAverage = () => {
    if (assignments.length === 0) return 0;
    const totalPoints = assignments.reduce((sum, assignment) => sum + assignment.grade, 0);
    const totalMaxPoints = assignments.reduce((sum, assignment) => sum + assignment.maxPoints, 0);
    return Math.round((totalPoints / totalMaxPoints) * 100);
  };

  // Simulate semester progress (you can make this dynamic later)
  const semesterProgress = 65; // 65% of semester completed

  const overallAverage = calculateOverallAverage();

  const getGradeColor = (average: number) => {
    if (average >= 90) return '#4CAF50'; // Green
    if (average >= 80) return '#FF9800'; // Orange
    if (average >= 70) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header with Overall Average */}
      <View style={styles.header}>
        <Text style={[styles.overallGrade, { color: getGradeColor(overallAverage) }]}>
          {overallAverage}%
        </Text>
        <Text style={styles.overallLabel}>Overall Average</Text>
        
        {/* Semester Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Semester Progress</Text>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${semesterProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{semesterProgress}% Complete</Text>
        </View>
      </View>

      {/* Assignments List */}
      <ScrollView style={styles.assignmentsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Recent Assignments</Text>
        
        {assignments.map((assignment) => (
          <View key={assignment.id} style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <Text style={styles.assignmentName}>{assignment.name}</Text>
              <Text style={[styles.assignmentGrade, { color: getGradeColor((assignment.grade / assignment.maxPoints) * 100) }]}>
                {assignment.grade}/{assignment.maxPoints}
              </Text>
            </View>
            <Text style={styles.assignmentSubject}>{assignment.subject}</Text>
            <Text style={styles.assignmentPercentage}>
              {Math.round((assignment.grade / assignment.maxPoints) * 100)}%
            </Text>
          </View>
        ))}

        {/* Add Assignment Button */}
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add New Assignment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallGrade: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  overallLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBarBackground: {
    width: '80%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  assignmentsList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  assignmentCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  assignmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  assignmentGrade: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  assignmentSubject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  assignmentPercentage: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});