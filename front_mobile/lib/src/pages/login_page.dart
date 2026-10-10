import 'package:flutter/material.dart';

class _LoginPageState extends State<LoginPage>{

  //variáveis para capturar o que o usuário digitou
  final emailController = TextEditingController();    //para email
  final senhaController = TextEditingController();    //para senha

  @override
  Widget build(BuildContext context){
    return MaterialApp(
      home: Scaffold(
            appBar: AppBar(
              title: Text('Faça cadastro', style: TextStyle(color: Colors.red),),
          ), 
            body: Padding(padding: EdgeInsets.all(16.0), 
            //Column para empilhar widgets verticalmente
                  child: Column(
                    children: 
                      //dois campos de texto: email e senha
                      //obscureText: true --> esconde os caracteres da senha
                      //SizedBox cria um espaço entre o campo senha e os botões
                      
                      [TextFormField(decoration: InputDecoration(labelText: 'Email', 
                      hintText: 'exemplo@email.com', 
                      hintStyle: TextStyle(color: Colors.black.withValues(alpha: 0.5))),
                      controller: emailController,
                      ), 
                      TextFormField(
                        decoration: InputDecoration(labelText: 'Senha', 
                        hintText: 'senha123', 
                        hintStyle: TextStyle(color: Colors.black.withValues(alpha: 0.5))), 
                        obscureText: true, 
                        controller: senhaController,), 
                        SizedBox(height: 16), 
                        ElevatedButton(onPressed: (){
                          //teste 
                          print('''Email: ${emailController.text}
                          Senha: ${senhaController.text}''');
                        }, 
                                      child: Text('Entrar')),
                        SizedBox(height: 16,),
                        TextButton(onPressed:(){}, 
                                  child: Text('Esqueci minha senha')),
                                  SizedBox(height: 10,),
                        TextButton(onPressed: (){},
                                  child: Text('Criar conta'))
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
