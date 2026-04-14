import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../network/api_client.dart';
import '../storage/secure_storage.dart';
import 'fcm_background.dart' show firebaseMessagingBackgroundHandler;

/// Canal de notificaciones locales (Android).
/// El id y el nombre deben coincidir con lo configurado en AndroidManifest si lo definís allí.
const _kChannelId = 'oftalmologia_push';
const _kChannelName = 'Oftalmología Notificaciones';
const _kChannelDesc = 'Notificaciones push de la clínica oftalmológica';

/// Plugin de notificaciones locales (para mostrar pushes cuando la app está en primer plano).
final _localNotif = FlutterLocalNotificationsPlugin();

/// Registro de token FCM con el backend y escucha de mensajes.
class PushNotifications {
  PushNotifications._();

  static final _messaging = FirebaseMessaging.instance;

  /// Token FCM cacheado en memoria desde el momento de initialize().
  /// Garantiza que esté disponible cuando el usuario hace login (sin esperar a getToken() de nuevo).
  static String? _cachedToken;

  /// Inicializar Firebase + permisos + handlers (llamar tras [WidgetsFlutterBinding.ensureInitialized]).
  static Future<void> initialize() async {
    // ── Firebase ──────────────────────────────────────────────────────────────
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      await _messaging.setAutoInitEnabled(true);
    } catch (e, st) {
      debugPrint('PushNotifications.initialize (Firebase): $e $st');
      return;
    }

    // ── Notificaciones locales (para primer plano) ────────────────────────────
    await _initLocalNotifications();

    // ── Permisos ──────────────────────────────────────────────────────────────
    try {
      final isApple = defaultTargetPlatform == TargetPlatform.iOS ||
          defaultTargetPlatform == TargetPlatform.macOS;
      if (isApple) {
        await _messaging.requestPermission(
          alert: true,
          badge: true,
          sound: true,
        );
      } else {
        await _messaging.requestPermission();
      }
    } catch (e, st) {
      debugPrint('PushNotifications.requestPermission: $e $st');
    }

    // ── Cachear token FCM anticipadamente ─────────────────────────────────────
    // Así cuando el usuario hace login, el token ya está disponible en memoria.
    try {
      _cachedToken = await _messaging.getToken();
      if (kDebugMode) {
        debugPrint('FCM token pre-cacheado: ${_cachedToken?.substring(0, 20)}…');
      }
    } catch (e) {
      debugPrint('PushNotifications: no se pudo pre-cachear token: $e');
    }

    // ── Listeners ─────────────────────────────────────────────────────────────
    try {
      // Mensaje recibido con app en PRIMER PLANO → mostrar notificación local.
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          debugPrint(
            'FCM foreground: ${message.notification?.title} | ${message.notification?.body}',
          );
        }
        _showLocalNotification(message);
      });

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (kDebugMode) {
          debugPrint('FCM opened app: ${message.messageId}');
        }
      });

      // Cuando Firebase rota el token, actualizamos el caché y el backend.
      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
        _cachedToken = newToken;
        final t = await SecureStorageService.getAccessToken();
        if (t != null && t.isNotEmpty) {
          await syncTokenWithBackend();
        }
      });
    } catch (e, st) {
      debugPrint('PushNotifications listeners: $e $st');
    }
  }

  // ── Notificaciones locales ──────────────────────────────────────────────────

  static Future<void> _initLocalNotifications() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings();
    const initSettings = InitializationSettings(android: androidInit, iOS: iosInit);

    await _localNotif.initialize(initSettings);

    // Crear canal de alta prioridad en Android (obligatorio Android 8+).
    const channel = AndroidNotificationChannel(
      _kChannelId,
      _kChannelName,
      description: _kChannelDesc,
      importance: Importance.high,
      playSound: true,
    );
    await _localNotif
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  static Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    final title = notification.title ?? 'Notificación';
    final body = notification.body ?? '';

    const androidDetails = AndroidNotificationDetails(
      _kChannelId,
      _kChannelName,
      channelDescription: _kChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails();
    const details = NotificationDetails(android: androidDetails, iOS: iosDetails);

    await _localNotif.show(
      message.hashCode,
      title,
      body,
      details,
    );
  }

  // ── Token helpers ──────────────────────────────────────────────────────────

  static String get _plataforma {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'ios';
      default:
        return 'android';
    }
  }

  /// Devuelve el token FCM (usa caché si está disponible, sino llama getToken()).
  /// Retorna null si Firebase no está disponible o el permiso fue denegado.
  static Future<String?> _getToken() async {
    if (_cachedToken != null && _cachedToken!.isNotEmpty) return _cachedToken;
    try {
      _cachedToken = await _messaging.getToken();
      return _cachedToken;
    } catch (_) {
      return null;
    }
  }

  /// Campos opcionales para el body de `auth/login/` y `auth/register/` (`fcm_token`, `plataforma`).
  static Future<Map<String, String>?> obtenerTokenYPlataformaParaAuth() async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) {
        debugPrint('PushNotifications: token FCM no disponible para auth');
        return null;
      }
      return <String, String>{
        'fcm_token': token,
        'plataforma': _plataforma,
      };
    } catch (_) {
      return null;
    }
  }

  /// POST `/notificaciones/dispositivos/` con JWT (p. ej. al restaurar sesión o post-login).
  static Future<void> syncTokenWithBackend() async {
    final access = await SecureStorageService.getAccessToken();
    if (access == null || access.isEmpty) return;

    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return;

      await ApiClient().dio.post<Map<String, dynamic>>(
        'notificaciones/dispositivos/',
        data: <String, dynamic>{
          'token': token,
          'plataforma': _plataforma,
        },
      );
      if (kDebugMode) {
        debugPrint('PushNotifications: token sincronizado con backend OK');
      }
    } catch (e, st) {
      debugPrint('PushNotifications.syncTokenWithBackend error: $e $st');
    }
  }

  /// Elimina token en backend y en FCM (llamar antes de cerrar sesión).
  static Future<void> unregisterFromBackend() async {
    try {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        await ApiClient().dio.delete<void>(
          'notificaciones/dispositivos/',
          queryParameters: <String, dynamic>{'token': token},
        );
      }
      await _messaging.deleteToken();
      _cachedToken = null;
    } catch (e, st) {
      debugPrint('PushNotifications.unregisterFromBackend error: $e $st');
    }
  }
}
