import 'package:flutter/material.dart';

class LoginPage extends State<App>{
  @override
  Widget build(BuildContext context){
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: Text('Faça cadastro', style: TextStyle(color: Colors.red),),
        ), body: Center(child: Text('Login')),
      ),

    );
  }
}

class App extends StatefulWidget {
  @override
  State<App> createState() {
    return LoginPage();
  }
}
