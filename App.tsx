import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Animated
} from 'react-native';

// Define types for our data
interface Assignment {
  id: number;
  name: string;
  grade: number;
  maxGrade: number;
  category: 'KU' | 'A' | 'TI' | 'C';
}

interface CategoryWeight {
  KU: number; // Knowledge & Understanding
  A: number;  // Application
  TI: number; // Thinking & Inquiry
  C: number;  // Communication
}

interface Subject {
  id: number;
  name: string;
  assignments: Assignment[];
  categoryWeights: CategoryWeight;
}

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectDetailVisible, setSubjectDetailVisible] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [newAssignmentName, setNewAssignmentName] = useState('');
  const [newAssignmentGrade, setNewAssignmentGrade] = useState('');
  const [newAssignmentMaxGrade, setNewAssignmentMaxGrade] = useState('100');
  const [newAssignmentCategory, setNewAssignmentCategory] = useState<'KU' | 'A' | 'TI' | 'C'>('KU');
  const [addAssignmentModalVisible, setAddAssignmentModalVisible] = useState(false);
  
  // Animated value for modal fade
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Calculate subject grade based on category weights
  const calculateSubjectGrade = (subject: Subject): number => {
    const categoryTotals = { KU: 0, A: 0, TI: 0, C: 0 };
    const categoryMaxTotals = { KU: 0, A: 0, TI: 0, C: 0 };
    
    subject.assignments.forEach(assignment => {
      categoryTotals[assignment.category] += assignment.grade;
      categoryMaxTotals[assignment.category] += assignment.maxGrade;
    });

    let weightedTotal = 0;
    let totalWeight = 0;

    Object.keys(categoryTotals).forEach(cat => {
      const category = cat as keyof CategoryWeight;
      if (categoryMaxTotals[category] > 0) {
        const categoryPercentage = (categoryTotals[category] / categoryMaxTotals[category]) * 100;
        weightedTotal += categoryPercentage * (subject.categoryWeights[category] / 100);
        totalWeight += subject.categoryWeights[category];
      }
    });

    return totalWeight > 0 ? Math.round(weightedTotal) : 0;
  };

  // Calculate overall average
  const calculateOverallAverage = (): number => {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((sum, subject) => sum + calculateSubjectGrade(subject), 0);
    return Math.round(total / subjects.length);
  };

  const semesterProgress = 65;
  const overallAverage = calculateOverallAverage();

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 80) return '#FF9800';
    if (percentage >= 70) return '#FFC107';
    return '#F44336';
  };

  // Handle add subject with fade animation
  const handleAddSubject = () => {
    if (subjects.length >= 4) {
      Alert.alert('Maximum Reached', 'You can only have up to 4 subjects.');
      return;
    }
    
    fadeAnim.setValue(0);
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setNewSubjectName('');
    });
  };

  const saveSubject = () => {
    if (newSubjectName.trim() === '') {
      Alert.alert('Error', 'Please enter a subject name.');
      return;
    }
    
    const newSubject: Subject = {
      id: Date.now(),
      name: newSubjectName.trim(),
      assignments: [],
      categoryWeights: { KU: 25, A: 25, TI: 25, C: 25 }
    };
    
    setSubjects([...subjects, newSubject]);
    closeModal();
  };

  // Handle subject card tap
  const openSubjectDetail = (subject: Subject) => {
    setSelectedSubject(subject);
    setSubjectDetailVisible(true);
  };

  // Update category weights
  const updateCategoryWeight = (category: keyof CategoryWeight, weight: number) => {
    if (!selectedSubject) return;
    
    const updatedSubject = {
      ...selectedSubject,
      categoryWeights: {
        ...selectedSubject.categoryWeights,
        [category]: weight
      }
    };
    
    setSelectedSubject(updatedSubject);
    setSubjects(subjects.map(s => s.id === selectedSubject.id ? updatedSubject : s));
  };

  // Add assignment
  const addAssignment = () => {
    if (!selectedSubject || !newAssignmentName.trim() || !newAssignmentGrade) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const newAssignment: Assignment = {
      id: Date.now(),
      name: newAssignmentName.trim(),
      grade: parseInt(newAssignmentGrade),
      maxGrade: parseInt(newAssignmentMaxGrade),
      category: newAssignmentCategory
    };

    const updatedSubject = {
      ...selectedSubject,
      assignments: [...selectedSubject.assignments, newAssignment]
    };

    setSelectedSubject(updatedSubject);
    setSubjects(subjects.map(s => s.id === selectedSubject.id ? updatedSubject : s));
    
    setAddAssignmentModalVisible(false);
    setNewAssignmentName('');
    setNewAssignmentGrade('');
    setNewAssignmentMaxGrade('100');
    setNewAssignmentCategory('KU');
  };

  return (
    <SafeAreaView style={styles.container}>
      {!subjectDetailVisible ? (
        // Main Screen
        <>
          <View style={styles.header}>
            <Text style={[styles.overallGrade, { color: '#fff' }]}>
              {overallAverage}%
            </Text>
            <Text style={styles.overallLabel}>Overall Average</Text>
            
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Semester Progress</Text>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[styles.progressBarFill, { width: `${semesterProgress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{semesterProgress}% Complete</Text>
            </View>
          </View>

          <ScrollView style={styles.subjectsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Subjects</Text>
            
            {subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No subjects added yet</Text>
                <Text style={styles.emptySubtext}>Tap the + button to add your first subject</Text>
              </View>
            ) : (
              subjects.map((subject) => {
                const percentage = calculateSubjectGrade(subject);
                return (
                  <TouchableOpacity 
                    key={subject.id} 
                    style={styles.subjectCard}
                    onPress={() => openSubjectDetail(subject)}
                  >
                    <View style={styles.subjectHeader}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <View style={[styles.gradeChip, { backgroundColor: getGradeColor(percentage) }]}>
                        <Text style={styles.gradeText}>{percentage}%</Text>
                      </View>
                    </View>
                    <Text style={styles.assignmentCount}>
                      {subject.assignments.length} assignment{subject.assignments.length !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {subjects.length < 4 && (
            <TouchableOpacity style={styles.floatingButton} onPress={handleAddSubject}>
              <Text style={styles.floatingButtonText}>+</Text>
            </TouchableOpacity>
          )}

          <Modal transparent visible={modalVisible} onRequestClose={closeModal}>
            <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Subject</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter subject name (e.g., English)"
                  value={newSubjectName}
                  onChangeText={setNewSubjectName}
                  autoFocus={true}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveSubject}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </Modal>
        </>
      ) : (
        // Subject Detail Screen
        selectedSubject && (
          <>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setSubjectDetailVisible(false)}>
                <Text style={styles.backButton}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.detailTitle}>{selectedSubject.name}</Text>
              <View style={[styles.gradeChip, { backgroundColor: getGradeColor(calculateSubjectGrade(selectedSubject)) }]}>
                <Text style={styles.gradeText}>{calculateSubjectGrade(selectedSubject)}%</Text>
              </View>
            </View>

            <ScrollView style={styles.detailContent}>
              {/* Category Weights */}
              <Text style={styles.sectionTitle}>Category Weights</Text>
              {Object.entries(selectedSubject.categoryWeights).map(([category, weight]) => (
                <View key={category} style={styles.weightRow}>
                  <Text style={styles.categoryLabel}>{category}:</Text>
                  <TextInput
                    style={styles.weightInput}
                    value={weight.toString()}
                    onChangeText={(text) => updateCategoryWeight(category as keyof CategoryWeight, parseInt(text) || 0)}
                    keyboardType="numeric"
                    onBlur={() => {}}
                  />
                  <Text style={styles.percentText}>%</Text>
                </View>
              ))}

              {/* Assignments by Category */}
              <View style={styles.assignmentsSection}>
                <Text style={styles.sectionTitle}>Assignments by Category</Text>
                {(['KU', 'A', 'TI', 'C'] as const).map(category => {
                  const categoryAssignments = selectedSubject.assignments.filter(a => a.category === category);
                  const categoryTotal = categoryAssignments.reduce((sum, a) => sum + a.grade, 0);
                  const categoryMaxTotal = categoryAssignments.reduce((sum, a) => sum + a.maxGrade, 0);
                  const categoryPercentage = categoryMaxTotal > 0 ? Math.round((categoryTotal / categoryMaxTotal) * 100) : 0;
                  
                  return (
                    <View key={category} style={styles.categorySection}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <View style={[styles.categoryGradeChip, { backgroundColor: getGradeColor(categoryPercentage) }]}>
                          <Text style={styles.categoryGradeText}>
                            {categoryMaxTotal > 0 ? `${categoryPercentage}%` : 'N/A'}
                          </Text>
                        </View>
                      </View>
                      
                      {categoryAssignments.length === 0 ? (
                        <Text style={styles.noAssignmentsText}>No assignments in this category</Text>
                      ) : (
                        categoryAssignments.map((assignment) => (
                          <View key={assignment.id} style={styles.assignmentItem}>
                            <Text style={styles.assignmentName}>{assignment.name}</Text>
                            <Text style={styles.assignmentGrade}>
                              {assignment.grade}/{assignment.maxGrade} ({Math.round((assignment.grade/assignment.maxGrade)*100)}%)
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  );
                })}
                
                <TouchableOpacity 
                  style={styles.addAssignmentButton}
                  onPress={() => setAddAssignmentModalVisible(true)}
                >
                  <Text style={styles.addAssignmentText}>+ Add Assignment</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Add Assignment Modal */}
            <Modal visible={addAssignmentModalVisible} transparent onRequestClose={() => setAddAssignmentModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Add Assignment</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Assignment name"
                    value={newAssignmentName}
                    onChangeText={setNewAssignmentName}
                    onBlur={() => {}}
                  />
                  <View style={styles.gradeRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginRight: 10 }]}
                      placeholder="Grade"
                      value={newAssignmentGrade}
                      onChangeText={setNewAssignmentGrade}
                      keyboardType="numeric"
                      onBlur={() => {}}
                    />
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      placeholder="Max grade"
                      value={newAssignmentMaxGrade}
                      onChangeText={setNewAssignmentMaxGrade}
                      keyboardType="numeric"
                      onBlur={() => {}}
                    />
                  </View>
                  
                  {/* Category Selection */}
                  <Text style={styles.categorySelectionTitle}>Category:</Text>
                  <View style={styles.categoryButtons}>
                    {(['KU', 'A', 'TI', 'C'] as const).map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          newAssignmentCategory === category && styles.categoryButtonSelected
                        ]}
                        onPress={() => setNewAssignmentCategory(category)}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          newAssignmentCategory === category && styles.categoryButtonTextSelected
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]} 
                      onPress={() => setAddAssignmentModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.saveButton]} 
                      onPress={addAssignment}
                    >
                      <Text style={styles.saveButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3d466dff',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  overallGrade: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  overallLabel: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 25,
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  progressBarBackground: {
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#78cbe2ff',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#b1d0d8ff',
    opacity: 0.9,
  },
  subjectsList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  subjectCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  gradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  assignmentCount: {
    fontSize: 14,
    color: '#666',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3d466dff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#3d466dff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailHeader: {
    backgroundColor: '#3d466dff',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    width: 40,
  },
  weightInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 60,
    textAlign: 'center',
    marginLeft: 10,
  },
  percentText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#666',
  },
  assignmentsSection: {
    marginTop: 20,
  },
  assignmentItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  assignmentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryGradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryGradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  noAssignmentsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  assignmentGrade: {
    fontSize: 14,
    color: '#666',
  },
  addAssignmentButton: {
    backgroundColor: '#3d466dff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addAssignmentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  gradeRow: {
    flexDirection: 'row',
  },
  categorySelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#3d466dff',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
});