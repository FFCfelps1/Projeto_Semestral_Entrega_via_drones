import 'package:flutter/material.dart';

class _LoginPageState extends State<LoginPage>{
  @override
  Widget build(BuildContext context){
    return Scaffold(
          appBar: AppBar(
            title: Text('Faça cadastro', style: TextStyle(color: Colors.red),),
          ), 
          body: Center(child: Text('Login')),
    );
  }
}

class LoginPage extends StatefulWidget {
  @override
  State<LoginPage> createState() {
    return _LoginPageState();
  }
}
