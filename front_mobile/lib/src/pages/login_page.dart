import 'package:flutter/material.dart';

/// Página responsável somente pela apresentação e pelo estado do login.
class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.onToggleTheme});

  final VoidCallback onToggleTheme;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _senhaController = TextEditingController();
  bool _senhaVisivel = false;

  @override
  Widget build(BuildContext context) {
    final temaEscuro = Theme.of(context).brightness == Brightness.dark;
    const azul = Color(0xff256af4);

    InputDecoration decoracao(String label, String hint, IconData icon) {
      return InputDecoration(
        prefixIcon: Icon(icon),
        floatingLabelBehavior: FloatingLabelBehavior.always,
        labelText: label,
        hintText: hint,
        labelStyle: const TextStyle(color: azul),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: azul),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: azul, width: 2),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        actionsPadding: const EdgeInsets.fromLTRB(0, 8, 20, 0),
        title: const _BrandTitle(),
        actions: [
          IconButton(
            onPressed: widget.onToggleTheme,
            icon: Icon(
              temaEscuro ? Icons.light_mode : Icons.dark_mode,
              color: azul,
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const _LoginIllustration(),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: decoracao('Email', 'exemplo@email.com', Icons.email),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _senhaController,
              obscureText: !_senhaVisivel,
              decoration: decoracao('Senha', 'senha123', Icons.lock_outline)
                  .copyWith(
                    suffixIcon: IconButton(
                      onPressed: () =>
                          setState(() => _senhaVisivel = !_senhaVisivel),
                      icon: Icon(
                        _senhaVisivel ? Icons.visibility_off : Icons.visibility,
                        size: 15,
                        color: azul,
                      ),
                    ),
                  ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: azul,
                foregroundColor: Colors.white,
              ),
              child: const Text('Entrar'),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {},
              child: const Text('Esqueci minha senha'),
            ),
            const SizedBox(height: 10),
            TextButton(onPressed: () {}, child: const Text('Criar conta')),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _BrandTitle extends StatelessWidget {
  const _BrandTitle();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Padding(
            padding: EdgeInsets.all(8),
            child: CustomPaint(painter: _DroneMarkPainter()),
          ),
        ),
        const SizedBox(width: 12),
        const Flexible(
          child: Text(
            'SkySwift',
            style: TextStyle(
              fontFamily: 'Manrope',
              fontSize: 21,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

/// Símbolo vetorial simples: permanece nítido em qualquer escala do dispositivo.
class _DroneMarkPainter extends CustomPainter {
  const _DroneMarkPainter();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);
    final stroke = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;
    for (final rotor in const [
      Offset(4, 4),
      Offset(20, 4),
      Offset(4, 20),
      Offset(20, 20),
    ]) {
      canvas.drawLine(const Offset(12, 12), rotor, stroke);
      canvas.drawCircle(rotor, 3, stroke);
    }
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(8, 9, 8, 6),
        const Radius.circular(2),
      ),
      Paint()..color = Colors.white,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_DroneMarkPainter oldDelegate) => false;
}

class _LoginIllustration extends StatelessWidget {
  const _LoginIllustration();

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Image.asset(
        dark ? 'assets/images/login-dark.png' : 'assets/images/login-light.png',
        height: 130,
        width: double.infinity,
        fit: BoxFit.cover,
        excludeFromSemantics: true,
      ),
    );
  }
}
