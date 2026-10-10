import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart' as google;

class _LoginPageState extends State<LoginPage>{

  //variáveis para capturar o que o usuário digitou
  final emailController = TextEditingController();    //para email
  final senhaController = TextEditingController();    //para senha

  //variável que armazena o tema atual ()'claro' ou 'escuro')
  bool temaEscuro = false;         //atualmente, tema 'claro'

  @override
  Widget build(BuildContext context){
    return MaterialApp(
      theme: temaEscuro ? ThemeData(
        brightness: Brightness.dark, //paleta (brilho) escura(o)
        scaffoldBackgroundColor: Color(0xff101622), // 0xff é 100% de opacidade, 101622 é código hexadecimal da cor
        //tema da AppBar
        appBarTheme: AppBarTheme(
          backgroundColor: Color(0xff101622),   //mesma cor
        )
      ) : ThemeData.light(),
      home: Scaffold(
            appBar: AppBar(
              //alinha título no centro
              centerTitle: true,
              //paddin para o ícone não ficar atrás da faixa 'debug'
              actionsPadding: EdgeInsets.fromLTRB(0, 8, 20, 0),
              title: Text('🚁Faça Login e voe conosco!!🚁', style: google.GoogleFonts.oswald(
                color: Color(0xff256af4),
                fontSize: 20.0,
                fontWeight: FontWeight.bold
              )),actions: [IconButton(onPressed: (){
                setState(() {temaEscuro = !temaEscuro;});
                }, 
              icon: Icon(temaEscuro ? Icons.light_mode: Icons.dark_mode, color: Color(0xff256af4),))],
          ), 
            body: Padding(padding: EdgeInsets.all(16.0), 
            //Column para empilhar widgets verticalmente
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: 
                      //dois campos de texto: email e senha
                      //obscureText: true --> esconde os caracteres da senha
                      //SizedBox cria um espaço entre o campo senha e os botões
                      
                      [Expanded(child: ClipRRect(
                                borderRadius: BorderRadiusGeometry.circular(10), 
                                            child: Image.asset('assets/images/drone2.jpg', fit: BoxFit.cover,)),
                            )
                      ,TextFormField(decoration: InputDecoration(labelText: 'Email', 
                      hintText: 'exemplo@email.com', 
                      hintStyle: TextStyle(color: temaEscuro ? Colors.white.withValues(alpha: 0.5) : Colors.black.withValues(alpha: 0.5)), labelStyle: TextStyle(color: Color(0xff256af4)), 
                      //linha abaixo do campo de entrada email quando ele não está selecionado
                      enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color:  Color(0xff256af4))
                        ), 
                        //linha abaixo do campo de entrada email quando ele está selecionado
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Color(0xff256af4), width: 2.0)
                        )),
                      controller: emailController,
                      ), 
                      TextFormField(
                        decoration: InputDecoration(labelText: 'Senha', 
                        hintText: 'senha123', 
                        hintStyle: TextStyle(color: temaEscuro ? Colors.white.withValues(alpha:0.5) : Colors.black.withValues(alpha: 0.5)), 
                        labelStyle: TextStyle(color: Color(0xff256af4)),
                        //linha abaixo do campo de entrada senha quando ele não está selecionado
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color:  Color(0xff256af4))
                        ), //linha abaixo do campo de entrada senha quando ele está selecionado
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Color(0xff256af4), width: 2.0))), 
                        obscureText: true, 
                        controller: senhaController,), 
                        SizedBox(height: 16), 
                        ElevatedButton(onPressed: (){
                          //teste 
                          // print('''Email: ${emailController.text}
                          // Senha: ${senhaController.text}''');
                        }, 
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Color(0xff256af4), //fundo azul primário
                                        foregroundColor: Colors.white   //texto banco no botão
                                      ),
                                      child: Text('Entrar'),),
                        SizedBox(height: 16,),
                        TextButton(onPressed:(){}, 
                                  style: TextButton.styleFrom(
                                    foregroundColor: Color(0xff256af4)
                                  ), 
                                  child: Text('Esqueci minha senha'),),
                                  SizedBox(height: 10,),
                        TextButton(onPressed: (){},
                                  style:TextButton.styleFrom(
                                    foregroundColor: Color(0xff256af4),
                                  ),
                                  child: Text('Criar conta')),

                                  //adiciona imagem ao final e arredonda as bordas
                                  SizedBox(height: 16,),
                                  Expanded(
                                  child: ClipRRect(borderRadius: BorderRadiusGeometry.circular(10), 
                                            child: Image.asset('assets/images/drone.jpg', fit: BoxFit.cover,)),
                            )
                        ],
                    ),
                ),
        ), 
    );
  }
}

class LoginPage extends StatefulWidget {
  @override
  State<LoginPage> createState() {
    return _LoginPageState();
  }
}
