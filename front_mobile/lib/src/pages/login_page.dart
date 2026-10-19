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
    final tecladoAberto = MediaQuery.viewInsetsOf(context).bottom > 0;
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _LoginHeader(onToggleTheme: widget.onToggleTheme),
                  const SizedBox(height: 16),
                  // A arte é decorativa: com o teclado, o espaço pertence ao formulário.
                  if (!tecladoAberto) ...[
                    const _LoginIllustration(),
                    const SizedBox(height: 24),
                  ],
                  Text(
                    'Entre na sua conta',
                    style: theme.textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Acompanhe suas entregas por drone.',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 24),
                  _LabeledField(
                    label: 'E-mail',
                    child: TextFormField(
                      controller: _emailController,
                      style: theme.textTheme.bodyLarge,
                      decoration: const InputDecoration(
                        hintText: 'nome@exemplo.com',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _LabeledField(
                    label: 'Senha',
                    child: TextFormField(
                      controller: _senhaController,
                      style: theme.textTheme.bodyLarge,
                      obscureText: !_senhaVisivel,
                      decoration: InputDecoration(
                        hintText: 'Digite sua senha',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          onPressed: () =>
                              setState(() => _senhaVisivel = !_senhaVisivel),
                          constraints: const BoxConstraints(
                            minWidth: 48,
                            minHeight: 48,
                          ),
                          icon: Icon(
                            _senhaVisivel
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {},
                      child: const Text('Esqueci minha senha'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(onPressed: () {}, child: const Text('Entrar')),
                  const SizedBox(height: 24),
                  Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        'Não tem conta?',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('Criar conta'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// O rótulo não desaparece ao digitar; erros podem ampliar o campo sem recorte.
class _LabeledField extends StatelessWidget {
  const _LabeledField({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 56),
          child: child,
        ),
      ],
    );
  }
}

class _LoginHeader extends StatelessWidget {
  const _LoginHeader({required this.onToggleTheme});

  final VoidCallback onToggleTheme;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final dark = colors.brightness == Brightness.dark;
    return Row(
      children: [
        const Expanded(child: _BrandTitle()),
        const SizedBox(width: 8),
        IconButton.filledTonal(
          onPressed: onToggleTheme,
          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
          style: IconButton.styleFrom(
            backgroundColor: colors.surfaceContainerHighest,
            foregroundColor: colors.onSurfaceVariant,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          icon: Icon(dark ? Icons.light_mode : Icons.dark_mode),
        ),
      ],
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
