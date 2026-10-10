import 'package:flutter/material.dart';

class _LoginPageState extends State<LoginPage>{
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
                      //
                      [TextFormField(decoration: InputDecoration(labelText: 'Email', hintText: 'exemplo@email.com', hintStyle: TextStyle(color: Colors.black.withValues(alpha: 0.5))),), 
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
