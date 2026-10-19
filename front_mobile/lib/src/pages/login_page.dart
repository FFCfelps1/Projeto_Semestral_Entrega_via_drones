import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
        centerTitle: true,
        actionsPadding: const EdgeInsets.fromLTRB(0, 8, 20, 0),
        title: Text(
          '🚁Faça Login e voe conosco!!🚁',
          style: GoogleFonts.oswald(
            color: azul,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
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
            Expanded(
              flex: 2,
              child: SizedBox(
                width: double.infinity,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.asset(
                    'assets/images/drone2.jpg',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
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
