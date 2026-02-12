from agent import agent

print("Hey 😊 How are you feeling today?")
print("Type 'bye' to exit.\n")

while True:
    user = input("You: ")

    if user.lower() == "bye":
        print("Companion: Bye! Take care 💛")
        break

    result = agent.invoke({"messages": [{"role": "user", "content": user}]})
    
    last_message = result["messages"][-1]
    print("Companion:", last_message.content)
