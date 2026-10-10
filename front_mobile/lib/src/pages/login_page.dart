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
              //padding para o ícone não ficar atrás da faixa 'debug' durante os testes
              actionsPadding: EdgeInsets.fromLTRB(0, 8, 20, 0),
              title: Text('🚁Faça Login e voe conosco!!🚁', style: google.GoogleFonts.oswald(
                color: Color(0xff256af4),
                fontSize: 20.0,
                fontWeight: FontWeight.bold
              )),
              //actions: lista de widgets que ficam no canto superior direito
              actions: [IconButton(onPressed: (){
                setState(() {temaEscuro = !temaEscuro;});
                }, 
              //ícone dos temas escuro e claro na TopBar
              icon: Icon(temaEscuro ? Icons.light_mode: Icons.dark_mode, color: Color(0xff256af4),))],
          ), 
            body: Padding(padding: EdgeInsets.all(16.0), 
            //Column para empilhar widgets verticalmente, 
            //adicionando-os a uma lista
                  child: Column(
                    //alinha
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: 
                      //dois campos de texto: email e senha
                      //obscureText: true --> esconde os caracteres da senha
                      //SizedBox cria um espaço entre o campo senha e os botões
                      //
                      //adiciona imagem antes dos campos preenchidos pelo usuário
                      //Expanded: filho ocupa todo o espaço disponível 
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
                        hintStyle: TextStyle(color: temaEscuro ? Colors.white.withValues(alpha:0.5) : Colors.black.withValues(alpha: 0.5)),   //opacidade em 50% 
                        labelStyle: TextStyle(color: Color(0xff256af4)),
                        //linha abaixo do campo de entrada senha quando ele não está selecionado
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color:  Color(0xff256af4))
                        ), 
                        //linha abaixo do campo de entrada senha quando ele está selecionado
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Color(0xff256af4), width: 2.0))
                          ), 
                        obscureText: true, 
                        controller: senhaController,), 
                        SizedBox(height: 16),     //espaçamento entre os campos de entrada e o botão
                        ElevatedButton(onPressed: (){
                          //teste
                          ////
                          /// ******* ação realizada quando o botão é pressionado *******
                          ///
                          // print('''Email: ${emailController.text}
                          // Senha: ${senhaController.text}''');
                        }, 
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Color(0xff256af4), //fundo azul primário
                                        foregroundColor: Colors.white       //texto banco no botão
                                      ),
                                      child: Text('Entrar'),),
                        SizedBox(height: 16,),
                        //opção 'esqueci minha senha'
                        TextButton(onPressed:(){}, 
                                  style: TextButton.styleFrom(
                                    foregroundColor: Color(0xff256af4)
                                  ), 
                                  child: Text('Esqueci minha senha'),),
                                  SizedBox(height: 10,),
                        //opção 'criar conta'
                        TextButton(onPressed: (){},
                                  style:TextButton.styleFrom(
                                    foregroundColor: Color(0xff256af4),
                                  ),
                                  child: Text('Criar conta')),
                                  SizedBox(height: 16,),
                                  //imagem ocupa todo o espaço permitido
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
