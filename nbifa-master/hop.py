class Person(Human):

    nume="sdfdsfds"

    prenume='dsaas'

    virsta=10

    init(nume,virsta):

        me.nume=nume
        me.virsta=virsta

    calculeaza():
        if x>y:
            print('dfsdfsd')
        else:
            print('fdsfsdfsd')
        return 5*7

    on(event,callback):
        callback()

    on(unu fn1,doi fn2):
        fn1()
        fn2() 
        return fn1(3)+fn2(4)   


p=Person('fdsfsd',20)

p.on('hi'):
   fun ():
    print('hi')

p.on unu(x,y):
    print(x+y)
doi(g):
    print(g)

