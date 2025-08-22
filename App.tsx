import React, { useEffect, useState } from 'react';
import { StatusBar } from "expo-status-bar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { styles } from './styles';

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
  
  // variables for welcome setup
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [userName, setUserName] = useState('');
  const [semesterStartDate, setSemesterStartDate] = useState('');
  const [semesterEndDate, setSemesterEndDate] = useState('');
  const [welcomeStep, setWelcomeStep] = useState(1); // Track which step of setup we're on

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

  // calculate semester progress
  const calculateSemesterProgress = (): number => {
    if (!semesterStartDate || !semesterEndDate) return 0;
    
    const today = new Date();
    const startDate = new Date(semesterStartDate);
    const endDate = new Date(semesterEndDate);
    
    // Make sure dates are valid
    if (startDate >= endDate) return 0;
    
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const progress = Math.max(0, Math.min(100, (daysPassed / totalDays) * 100));
    return Math.round(progress);
  };

  // Calculate overall average
  const calculateOverallAverage = (): number => {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((sum, subject) => sum + calculateSubjectGrade(subject), 0);
    return Math.round(total / subjects.length);
  };

  const semesterProgress = calculateSemesterProgress();
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

  const saveSubject = async () => {
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
    
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    
    // Save to storage
    await saveToStorage(STORAGE_KEYS.SUBJECTS, updatedSubjects);
    
    closeModal();
  };

  // Handle subject card tap
  const openSubjectDetail = (subject: Subject) => {
    setSelectedSubject(subject);
    setSubjectDetailVisible(true);
  };

  // Update category weights
  const updateCategoryWeight = async (category: keyof CategoryWeight, weight: number) => {
    if (!selectedSubject) return;
    
    const updatedSubject = {
      ...selectedSubject,
      categoryWeights: {
        ...selectedSubject.categoryWeights,
        [category]: weight
      }
    };
    
    const updatedSubjects = subjects.map(s => s.id === selectedSubject.id ? updatedSubject : s);
    
    setSelectedSubject(updatedSubject);
    setSubjects(updatedSubjects);
    
    // Save to storage
    await saveToStorage(STORAGE_KEYS.SUBJECTS, updatedSubjects);
  };

  // Functions for welcome screen
  const handleWelcomeNext = () => {
    if (welcomeStep === 1 && userName.trim() === '') {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }
    if (welcomeStep === 2 && semesterStartDate === '') {
      Alert.alert('Error', 'Please select your semester start date.');
      return;
    }
    if (welcomeStep === 3 && semesterEndDate === '') {
      Alert.alert('Error', 'Please select your semester end date.');
      return;
    }
    
    if (welcomeStep < 3) {
      setWelcomeStep(welcomeStep + 1);
    } else {
      // Validate dates
      const startDate = new Date(semesterStartDate);
      const endDate = new Date(semesterEndDate);
      if (startDate >= endDate) {
        Alert.alert('Error', 'End date must be after start date.');
        return;
      }
      
      // Save all welcome data
      setIsFirstTime(false);
      saveToStorage(STORAGE_KEYS.IS_FIRST_TIME, false);
      saveToStorage(STORAGE_KEYS.USER_NAME, userName);
      saveToStorage(STORAGE_KEYS.SEMESTER_START, semesterStartDate);
      saveToStorage(STORAGE_KEYS.SEMESTER_END, semesterEndDate);
    }
  };

  const handleWelcomeBack = () => {
    if (welcomeStep > 1) {
      setWelcomeStep(welcomeStep - 1);
    }
  };

  // for remembering user data 
  const STORAGE_KEYS = {
    IS_FIRST_TIME: 'isFirstTime',
    USER_NAME: 'userName',
    SEMESTER_START: 'semesterStartDate',
    SEMESTER_END: 'semesterEndDate',
    SUBJECTS: 'subjects',
    ASSIGNMENTS: 'assignments'
  };

  const saveToStorage = async (key: string, value: any) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  const loadFromStorage = async (key: string) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.log('Error loading data:', error);
      return null;
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      console.log('All data cleared');
    } catch (error) {
      console.log('Error clearing data:', error);
    }
  };

  // Add assignment
  const addAssignment = async () => {
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

    const updatedSubjects = subjects.map(s => s.id === selectedSubject.id ? updatedSubject : s);
    
    setSelectedSubject(updatedSubject);
    setSubjects(updatedSubjects);
    
    // Save to storage
    await saveToStorage(STORAGE_KEYS.SUBJECTS, updatedSubjects);
    
    setAddAssignmentModalVisible(false);
    setNewAssignmentName('');
    setNewAssignmentGrade('');
    setNewAssignmentMaxGrade('100');
    setNewAssignmentCategory('KU');
  };

  // Load saved data when app starts
  useEffect(() => {
    loadSavedData();
  }, []); // Empty array means this runs only once when app starts

  const loadSavedData = async () => {
    try {
      // Load all saved data
      const savedIsFirstTime = await loadFromStorage(STORAGE_KEYS.IS_FIRST_TIME);
      const savedUserName = await loadFromStorage(STORAGE_KEYS.USER_NAME);
      const savedStartDate = await loadFromStorage(STORAGE_KEYS.SEMESTER_START);
      const savedEndDate = await loadFromStorage(STORAGE_KEYS.SEMESTER_END);
      const savedSubjects = await loadFromStorage(STORAGE_KEYS.SUBJECTS);

      // Update state with saved data if it exists
      if (savedIsFirstTime !== null) {
        setIsFirstTime(savedIsFirstTime);
      }
      if (savedUserName) {
        setUserName(savedUserName);
      }
      if (savedStartDate) {
        setSemesterStartDate(savedStartDate);
      }
      if (savedEndDate) {
        setSemesterEndDate(savedEndDate);
      }
      if (savedSubjects) {
        setSubjects(savedSubjects);
      }
    } catch (error) {
      console.log('Error loading saved data:', error);
    }
  };

  const [showFabOptions, setShowFabOptions] = useState(false);

  return (
    // Make sure the top-level SafeAreaView has a consistent background color
    <SafeAreaView style={styles.container}>
      {/* Set the status bar style for iOS (it handles dark/light content) */}
      <StatusBar style="light" backgroundColor="#1b4965" translucent={false}/>

      {isFirstTime ? (
        // Welcome Screen
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeContent}>
            {welcomeStep === 1 && (
              <>
                <Text style={styles.welcomeTitle}>Hello! 👋</Text>
                <Text style={styles.welcomeSubtitle}>Welcome to Grade Tracker</Text>
                <Text style={styles.welcomeText}>Let's get you set up! First, what's your name?</Text>
                <TextInput
                  style={styles.welcomeInput}
                  placeholder="Enter your name"
                  value={userName}
                  onChangeText={setUserName}
                  autoFocus={true}
                />
              </>
            )}
            
            {welcomeStep === 2 && (
              <>
                <Text style={styles.welcomeTitle}>Hi {userName}! 😊</Text>
                <Text style={styles.welcomeText}>When does your semester start?</Text>
                <Text style={styles.dateHelper}>Format: YYYY-MM-DD (e.g., 2024-09-01)</Text>
                <TextInput
                  style={styles.welcomeInput}
                  placeholder="2024-09-01"
                  value={semesterStartDate}
                  onChangeText={setSemesterStartDate}
                  autoFocus={true}
                />
              </>
            )}
            
            {welcomeStep === 3 && (
              <>
                <Text style={styles.welcomeTitle}>Almost done! 🎯</Text>
                <Text style={styles.welcomeText}>When does your semester end?</Text>
                <Text style={styles.dateHelper}>Format: YYYY-MM-DD (e.g., 2024-12-15)</Text>
                <TextInput
                  style={styles.welcomeInput}
                  placeholder="2024-12-15"
                  value={semesterEndDate}
                  onChangeText={setSemesterEndDate}
                  autoFocus={true}
                />
              </>
            )}
            
            <View style={styles.welcomeButtons}>
              {welcomeStep > 1 && (
                <TouchableOpacity style={styles.welcomeBackButton} onPress={handleWelcomeBack}>
                  <Text style={styles.welcomeBackButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.welcomeNextButton} onPress={handleWelcomeNext}>
                <Text style={styles.welcomeNextButtonText}>
                  {welcomeStep === 3 ? 'Get Started!' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.welcomeProgress}>
              <Text style={styles.welcomeProgressText}>Step {welcomeStep} of 3</Text>
              <View style={styles.welcomeProgressBar}>
                <View style={[styles.welcomeProgressFill, { width: `${(welcomeStep / 3) * 100}%` }]} />
              </View>
            </View>
          </View>
        </View>
      ) : !subjectDetailVisible ? (
        // Main screen
        <>
          <View style={styles.header}>
            <Text style={[styles.overallGrade, { color: '#fff' }]}>
              {overallAverage}%
            </Text>
            <Text style={styles.overallLabel}>Hi {userName}! this is your overall average :) </Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[styles.progressBarFill, { width: `${semesterProgress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>Semester {semesterProgress}% Complete</Text>
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
            <>
              <TouchableOpacity 
                style={styles.floatingButton} 
                onPress={() => setShowFabOptions(true)}
              >
                <Text style={styles.floatingButtonText}>+</Text>
              </TouchableOpacity>

              <Modal 
                transparent 
                visible={showFabOptions} 
                animationType="fade"
                onRequestClose={() => setShowFabOptions(false)}
              >
                <TouchableOpacity 
                  style={styles.fabOverlay} 
                  activeOpacity={1} 
                  onPressOut={() => setShowFabOptions(false)}
                >
                  <View style={styles.fabOptions}>
                    <TouchableOpacity 
                      style={styles.fabOptionButton} 
                      onPress={() => {
                        setShowFabOptions(false);
                        handleAddSubject();
                      }}
                    >
                      <Text style={styles.fabOptionText}>➕ Add Subject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.fabOptionButton, { backgroundColor: '#62b6cb' }]} 
                      onPress={() => {
                        setShowFabOptions(false);
                        Alert.alert(
                          'Reset App',
                          'This will delete all your data. Are you sure?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Reset', 
                              style: 'destructive',
                              onPress: async () => {
                                await clearAllData();
                                setIsFirstTime(true);
                                setUserName('');
                                setSemesterStartDate('');
                                setSemesterEndDate('');
                                setSubjects([]);
                                setWelcomeStep(1);
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={[styles.fabOptionText, { color: '#fff' }]}>🔄 Reset App</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
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

              <ScrollView style={styles.assignmentsSection}>
              <Text style={styles.sectionTitle}>Assignments</Text>
              {(['KU', 'A', 'TI', 'C'] as const).map(category => {
                const categoryAssignments = selectedSubject.assignments.filter(a => a.category === category);
                const categoryTotal = categoryAssignments.reduce((sum, a) => sum + a.grade, 0);
                const categoryMaxTotal = categoryAssignments.reduce((sum, a) => sum + a.maxGrade, 0);
                const categoryPercentage = categoryMaxTotal > 0 ? Math.round((categoryTotal / categoryMaxTotal) * 100) : 0;

                return (
                  <View key={category} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>{category}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                        <TextInput
                          style={[styles.weightInput, { width: 60,  }]}
                          value={selectedSubject.categoryWeights[category].toString()}
                          onChangeText={text => {
                            const weightNum = parseInt(text) || 0;
                            updateCategoryWeight(category, weightNum);
                          }}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                        <Text style={styles.percentText}>%</Text>
                      </View>
                      <View style={[styles.categoryGradeChip, { backgroundColor: getGradeColor(categoryPercentage), marginLeft: 8 }]}>
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
            </ScrollView>

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