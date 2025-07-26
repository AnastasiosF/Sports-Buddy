import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@rneui/themed';
import { useThemeColors } from '../hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

interface ModernDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  color?: string;
}

interface WheelPickerProps {
  data: string[];
  selectedIndex: number;
  onValueChange: (index: number) => void;
  itemHeight?: number;
  visibleItems?: number;
  themeColors?: any;
}

const WheelPicker: React.FC<WheelPickerProps> = ({
  data,
  selectedIndex,
  onValueChange,
  itemHeight = 40,
  visibleItems = 5,
  themeColors,
}) => {
  const containerHeight = itemHeight * visibleItems;
  const scrollY = React.useRef(new Animated.Value(selectedIndex * itemHeight)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.y / itemHeight);
    const clampedIndex = Math.max(0, Math.min(newIndex, data.length - 1));
    onValueChange(clampedIndex);
  };

  return (
    <View style={[styles.wheelContainer, { height: containerHeight }]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentOffset={{ x: 0, y: selectedIndex * itemHeight }}
      >
        {data.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.wheelItem, { height: itemHeight }]}
            onPress={() => onValueChange(index)}
          >
            <Text
              style={[
                styles.wheelItemText,
                { color: themeColors?.textSecondary || '#999' },
                index === selectedIndex && [
                  styles.selectedWheelItemText,
                  { color: themeColors?.text || '#333' }
                ],
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>
      <View style={[
        styles.selectionIndicator, 
        { 
          top: (visibleItems - 1) * itemHeight / 2,
          backgroundColor: themeColors?.primary ? `${themeColors.primary}20` : 'rgba(0, 122, 255, 0.1)',
          borderColor: themeColors?.primary ? `${themeColors.primary}50` : 'rgba(0, 122, 255, 0.3)'
        }
      ]} />
    </View>
  );
};

export const ModernDateTimePicker: React.FC<ModernDateTimePickerProps> = ({
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  title = 'Select Date & Time',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  color,
}) => {
  const colors = useThemeColors();
  const themeColor = color || colors.primary;
  
  const [isVisible, setIsVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  const showPicker = () => {
    setTempDate(value);
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hidePicker = () => {
    Animated.spring(slideAnim, {
      toValue: height,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleConfirm = () => {
    onChange(tempDate);
    hidePicker();
  };

  const handleCancel = () => {
    setTempDate(value);
    hidePicker();
  };

  // Generate date/time options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const selectedYear = tempDate.getFullYear();
  const selectedMonth = tempDate.getMonth();
  const selectedDay = tempDate.getDate();
  const selectedHour = tempDate.getHours();
  const selectedMinute = tempDate.getMinutes();

  const updateDate = (year?: number, month?: number, day?: number, hour?: number, minute?: number) => {
    const newDate = new Date(tempDate);
    if (year !== undefined) newDate.setFullYear(year);
    if (month !== undefined) newDate.setMonth(month);
    if (day !== undefined) newDate.setDate(day);
    if (hour !== undefined) newDate.setHours(hour);
    if (minute !== undefined) newDate.setMinutes(minute);
    setTempDate(newDate);
  };

  const formatDisplayValue = () => {
    if (mode === 'date') {
      return value.toLocaleDateString();
    } else if (mode === 'time') {
      return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return `${value.toLocaleDateString()} ${value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <View>
      <TouchableOpacity style={[styles.triggerButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={showPicker}>
        <View style={styles.triggerContent}>
          <Ionicons 
            name={mode === 'time' ? 'time-outline' : 'calendar-outline'} 
            size={20} 
            color={themeColor} 
          />
          <Text style={[styles.triggerText, { color: colors.text }]}>{formatDisplayValue()}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            onPress={handleCancel}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }], backgroundColor: colors.background }
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            </View>

            <View style={styles.pickersContainer}>
              {(mode === 'date' || mode === 'datetime') && (
                <>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Day</Text>
                    <WheelPicker
                      data={days}
                      selectedIndex={selectedDay - 1}
                      onValueChange={(index) => updateDate(undefined, undefined, index + 1)}
                      themeColors={colors}
                    />
                  </View>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
                    <WheelPicker
                      data={months}
                      selectedIndex={selectedMonth}
                      onValueChange={(index) => updateDate(undefined, index)}
                      themeColors={colors}
                    />
                  </View>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
                    <WheelPicker
                      data={years}
                      selectedIndex={years.findIndex(y => y === selectedYear.toString())}
                      onValueChange={(index) => updateDate(parseInt(years[index]))}
                      themeColors={colors}
                    />
                  </View>
                </>
              )}

              {(mode === 'time' || mode === 'datetime') && (
                <>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Hour</Text>
                    <WheelPicker
                      data={hours}
                      selectedIndex={selectedHour}
                      onValueChange={(index) => updateDate(undefined, undefined, undefined, index)}
                      themeColors={colors}
                    />
                  </View>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Min</Text>
                    <WheelPicker
                      data={minutes}
                      selectedIndex={selectedMinute}
                      onValueChange={(index) => updateDate(undefined, undefined, undefined, undefined, index)}
                      themeColors={colors}
                    />
                  </View>
                </>
              )}
            </View>

            <View style={styles.modalActions}>
              <Button
                title={cancelText}
                buttonStyle={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                titleStyle={[styles.cancelButtonText, { color: colors.text }]}
                onPress={handleCancel}
              />
              <Button
                title={confirmText}
                buttonStyle={[styles.actionButton, { backgroundColor: themeColor }]}
                titleStyle={styles.confirmButtonText}
                onPress={handleConfirm}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  wheelContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  wheelItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 18,
    fontWeight: '400',
  },
  selectedWheelItemText: {
    fontWeight: '600',
    fontSize: 20,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    pointerEvents: 'none',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.45,
    borderRadius: 12,
    paddingVertical: 16,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});