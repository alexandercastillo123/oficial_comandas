import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  Modal
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { STORAGE_KEY_IP, DEFAULT_IP, BACKEND_PORT, syncConfig } from '../../constants/config';
import axios from 'axios';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ip, setIp] = useState(DEFAULT_IP);
  const [ipInput, setIpInput] = useState(DEFAULT_IP);
  const [connected, setConnected] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await syncConfig();
        const stored = await AsyncStorage.getItem(STORAGE_KEY_IP);
        const loaded = stored ? stored : DEFAULT_IP;
        setIp(loaded);
        setIpInput(loaded);
      } catch (e) {
        setIp(DEFAULT_IP);
        setIpInput(DEFAULT_IP);
      }
    };
    init();
  }, []);

  const checkConnection = async () => {
    try {
      setChecking(true);
      setConnected(false);
      const response = await axios.get(`http://${ipInput}:${BACKEND_PORT}/health`, { timeout: 5000 });
      if (response.status === 200) {
        setConnected(true);
      } else {
        setConnected(false);
        Alert.alert('Sin conexión', 'El backend respondió pero con estado distinto de 200. Revise la dirección IP.');
      }
    } catch (error) {
      setConnected(false);
      Alert.alert('Sin conexión', 'No se pudo conectar al backend. Revise la dirección IP y que el servidor esté encendido.');
    } finally {
      setChecking(false);
    }
  };

  const saveIpToDevice = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_IP, ipInput);
      setIp(ipInput);
      setConnected(true);
      setShowConfig(false);
      Alert.alert('Guardado', 'IP guardada correctamente en el dispositivo.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la IP en el dispositivo.');
    }
  };

  const handleLogin = async () => {
    if (!usuario.trim() || !clave.trim()) {
      Alert.alert('Campos Obligatorios', 'Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    const result = await login(usuario.trim(), clave);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error de Autenticación', result.error);
    }
  };

  const openConfig = async () => {
    setIpInput(ip);
    setShowConfig(true);
  };

  const statusColor = connected ? '#2e7d32' : '#9e9e9e';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

        {/* Cabecera exterior */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../public/img/image.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Bienvenido a La Ideal</Text>
          <Text style={styles.brandSubtitle}>Gestión Artesanal de Panadería</Text>
        </View>

        {/* Tarjeta de Login */}
        <View style={styles.card}>
          {/* Formulario */}
          <View style={styles.form}>
            {/* Input Usuario */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Usuario</Text>
              <Feather name="user" size={18} color="#7a7067" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Ingrese su usuario"
                placeholderTextColor="#a19c90"
                value={usuario}
                onChangeText={setUsuario}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Input Contraseña */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <Feather name="lock" size={18} color="#7a7067" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#a19c90"
                secureTextEntry={!showPassword}
                value={clave}
                onChangeText={setClave}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color="#7a7067" />
              </TouchableOpacity>
            </View>

            {/* Botón Entrar */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? 'Cargando...' : 'Entrar →'}
              </Text>
            </TouchableOpacity>

            {/* Estado */}
            <View style={styles.cardFooter}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={styles.statusText}>
                  {connected ? 'Conectado correctamente' : 'Sistema Activo'}
                </Text>
              </View>

              {/* Botón configuración */}
              <TouchableOpacity style={styles.settingsButton} onPress={openConfig}>
                <Feather name="settings" size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Modal de configuración de IP */}
      <Modal visible={showConfig} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Conexión IP de sucursal</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="192.168.1.7"
              placeholderTextColor="#a19c90"
              value={ipInput}
              onChangeText={setIpInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numeric"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.checkButton]}
                onPress={checkConnection}
                disabled={checking}
              >
                <Text style={styles.modalButtonText}>
                  {checking ? 'Comprobando...' : 'Comprobar conexión'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveIpToDevice}
                disabled={!connected}
              >
                <Text style={styles.modalButtonText}>Guardar en Celular</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowConfig(false)}>
              <Text style={styles.modalClose}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgScreen,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  logoImage: {
    width: 210,
    height: 105,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c1e00',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#745c00',
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#eeeae5',
    shadowColor: '#2c1e00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#d5c3bd',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: '#ffffff',
    position: 'relative',
    marginVertical: 12,
  },
  inputLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#7a7067',
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#2c1e00',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  loginBtn: {
    backgroundColor: '#2c1e00',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2c1e00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5c544e',
  },
  settingsButton: {
    position: 'absolute',
    right: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2c1e00',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d5c3bd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2c1e00',
    marginBottom: 16,
  },
  modalButtonRow: {
    gap: 10,
  },
  modalButton: {
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    backgroundColor: '#2c1e00',
  },
  saveButton: {
    backgroundColor: '#2c1e00',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalClose: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    color: '#5c544e',
  },
});